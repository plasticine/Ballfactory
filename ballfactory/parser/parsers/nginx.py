import re
import httpagentparser
from ballfactory.parser.parsers import Parser

class Backend(Parser):
    """docstring for Nginx"""
    def __init__(self):
        super(Parser, self).__init__()
        self.pattern = r'^(?P<remote_addr>[^\s]+) - - (?P<time_local>.+) \"(?P<request>.+)\" (?P<status>\d+) (?P<body_bytes_sent>\d+) \"(?P<http_referer>.+)\" \"(?P<http_user_agent>.+)\"'
    
    def filter(self, line=''):
        """docstring for filter"""
        line['time_local'] = line['time_local'][1:-1]
        line['http_user_agent'] = httpagentparser.simple_detect(line['http_user_agent'])
        return line