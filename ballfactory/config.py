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
    
    def __getitem__(self, key):
        return self.config.get(key)