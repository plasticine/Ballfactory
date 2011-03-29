import re, os.path
import httpagentparser
from urlparse import urlparse
from ballfactory.parser.parsers import Parser

class Backend(Parser):
    """docstring for Nginx"""
    def __init__(self):
        super(Parser, self).__init__()
        self.file_types = {
            'image':('.png', '.jpg', '.gif', '.jpeg'),
            'css':('.css',),
            'javascript':('.js',),
            'other':('.zip', '.tar', '.tiff',)
        }
        self.pattern = r'^(?P<remote_addr>[^\s]+) - - (?P<time_local>.+) \"(?P<request>.+)\" (?P<status>\d+) (?P<body_bytes_sent>\d+) \"(?P<http_referer>.+)\" \"(?P<http_user_agent>.+)\"'
    
    def filter(self, line=''):
        """docstring for filter"""
        line['time_local'] = line['time_local'][1:-1]
        line['http_user_agent'] = httpagentparser.simple_detect(line['http_user_agent'])
        self.parse_request(line)
        return line
    
    def parse_request(self, line):
        match = re.match(r'^(?P<method>[^\s]+) (?P<path>[^\s]+) (?P<protocol>[^\s]+)', line['request'])
        if match:
            request = match.groupdict()
            line['method'] = request['method']
            line['path'] = request['path']
            line['type'] = self.match_resource_type(request['path'])
    
    def match_resource_type(self, path):
        for type, extensions in self.file_types.items():
            if os.path.splitext(path)[1] in extensions:
                return type
        if os.path.splitext(path)[1] != '':
            return 'other'
        return 'page'