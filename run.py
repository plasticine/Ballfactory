#!/Users/justin/Sites/py-gltail/bin python
# encoding: utf-8

"""
run.py

Created by Justin Morris on 2011-02-16.
Copyright (c) 2011 __MyCompanyName__. All rights reserved.
"""

import time, signal
import sys, os, logging, uuid
import os.path
import json
import multiprocessing
import time
import logging
from optparse import OptionParser

import tornado.auth
import tornado.escape
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
from tornado.web import URLSpec as url
from tornado.options import define, options

from ballfactory.config import Config
from ballfactory.sshtail import SSHFileTail


define("port", default=8888, help="run on the given port", type=int)


class Application(tornado.web.Application):
    def __init__(self):
        routes = [
            url(r"/", MainHandler, name="main"),
            url(r"/host/(.*)/socket", LogHandler, name="socket")
        ]
        settings = dict(
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            debug=True
        )
        tornado.web.Application.__init__(self, routes, **settings)
        
        self.config = Config()
        self.producers = dict()
        self.tasks = multiprocessing.JoinableQueue()


class BaseHandler(tornado.web.RequestHandler):
    @property
    def config(self):
        return self.application.config


class MainHandler(BaseHandler):
    def get(self):
        hosts = [self.reverse_url('socket', key) for key in self.config['hosts'].keys()]
        self.render('index.html', hosts=hosts)


class LogHandler(tornado.websocket.WebSocketHandler):
    def __init__(self, *args, **kwargs):
        super(LogHandler, self).__init__(*args, **kwargs)
    
    @property
    def config(self):
        return self.application.config
    
    def open(self, host_name):
        self.host_name = host_name
        self.lines = multiprocessing.Queue()
        self.new_connection()
        def _poll():
            try:
                message = self.lines.get(False)
                message = json.dumps(message)
                self.send_message(message=message)
            except Exception, err:
                pass#print err
            tornado.ioloop.IOLoop.instance().add_timeout(time.time()+0.01, _poll)
        _poll()
    
    def on_message(self, message):
        pass
    
    def send_message(self, message):
        message = u'%s' % (message)
        self.write_message(message)
    
    def on_close(self):
        if hasattr(self, 'producer') and self.producer is not None:
            self.producer.terminate()
    
    def new_connection(self):
        """docstring for new_connection"""
        self.host = self.config['hosts'][self.host_name]
        self.producer = multiprocessing.Process(
            target=SSHFileTail,
            name='sshTail-%s' % self.host['host'],
            kwargs={
                'socket_url':self.reverse_url('socket', self.host_name),
                'host':self.host['host'],
                'files':self.host['files'],
                'port':self.host.get('port'),
                'queue':self.lines,
            }
        )
        # self.producer.start()


def main():
    application = Application()
    try:
        tornado.options.parse_command_line()
        http_server = tornado.httpserver.HTTPServer(application)
        http_server.listen(options.port)
        tornado.ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        tornado.ioloop.IOLoop.instance().stop()

if __name__ == "__main__":
    sys.path.append(os.path.normpath(os.path.abspath(os.path.split(__file__)[0])))
    sys.path.append(os.path.normpath(os.path.abspath(os.path.join(os.path.split(__file__)[0], '../'))))
    main()