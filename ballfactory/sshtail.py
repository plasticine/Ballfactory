import os
import select
import time
import paramiko
import hashlib
import logging
import httplib, urllib
from string import Template
from ballfactory.parser import get_parser

SSH_DIR = os.path.join(os.path.expanduser('~'),'.ssh')
SSH_KEY = os.path.join(SSH_DIR, 'id_rsa')
TAIL_COMMAND = 'tail -f -n 0 $file'


class SSHFileTail(object):
    """
    
    1. Connect to a remote host over SSH
    2. Run tail command remotely & pass back the output
    
    """
    def __init__(self, queue, socket_url, host, files, port=22):
        super(SSHFileTail, self).__init__()
        # TODO Host should split on ":" for port, eg "pixelbloom.com:1337"
        self.queue = queue
        self.host = host
        self.port = int(port)
        self.files = files
        self.ssh = paramiko.SSHClient()
        self.ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        self.channels = dict()
        
        if self.connect():
            self.run()
    
    def get_channel(self):
        return self.transport.open_session()
    
    def connect(self):
        try:
            self.ssh.connect(self.host, port=self.port, key_filename=SSH_KEY)
            self.transport = self.ssh.get_transport()
            return True
        except Exception, err:
            pass# print err
    
    def run(self):
        for label, file in self.files.items():
            new_channel = self.get_channel()
            new_channel.exec_command(Template(TAIL_COMMAND).substitute(file=file['path']))
            self.channels[hashlib.sha1(label).hexdigest()] = {
                'channel':new_channel,
                'parser':get_parser(parser='ballfactory.parser.parsers.%s.Backend' % (file['parser']))
            }
        try:
            while True:
                for hash, channel in self.channels.items():
                    parser = channel['parser']
                    rr, wr, xr = select.select([channel['channel']], [], [], 0.0)
                    if len(rr) > 0:
                        lines = channel['channel'].recv(4096).split('\n')
                        for line in lines:
                            line = parser.parse(line=line)
                            if line:
                                self.queue.put(line, False)
                time.sleep(0.01)
        except Exception, err:
            pass# print err
        