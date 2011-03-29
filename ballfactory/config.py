import os
from configobj import ConfigObj

DEFAULT_CONFIG_FILE = os.path.abspath(os.path.join(os.path.split(__file__)[0], '../config.ini'))


class Error(Exception):
    """ Base class for exceptions. """
    pass


class ConfigNotFound(Error):
    """ Base class for exceptions. """
    def __init__(self, msg):
        self.msg = msg


class Config(object):
    """
    
    """
    def __init__(self, config_file=None):
        super(Config, self).__init__()
        self.config_file = config_file if config_file else DEFAULT_CONFIG_FILE
        if not os.path.exists(self.config_file):
            raise ConfigNotFound('Config file could not be found: %s' % (self.config_file))
        
        self.config = ConfigObj(self.config_file)
        if 'colours' in self.config:
            for key, colour in self.config['colours'].items():
                self.config['colours'][key] = self.hex_to_rgb(colour)
        else:
            self.config['colours'] = {'page': (249, 228, 173), 'image': (230, 176, 152), 'javascript': (49, 21, 43), 'css': (204, 68, 82), 'other': (114, 49, 71)}
    
    def __getitem__(self, key):
        return self.config.get(key)
    
    def hex_to_rgb(self, colour):
        colour = colour.lstrip('#')
        lv = len(colour)
        return tuple(int(colour[i:i+lv/3], 16) for i in range(0, lv, lv/3))