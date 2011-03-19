import re

class Parser(object):
    """docstring for Parser"""
    def __init__(self):
        super(Parser, self).__init__()
    
    def parse(self, line):
        """docstring for parse"""
        match = re.match(self.pattern, line)
        if match:
            return self.filter(match.groupdict())