# Python 2.7 has an importlib with import_module; for older Pythons,
# Django's bundled copy provides it.
from importlib import import_module

class ImproperlyConfigured(Exception):
    """ Base class for exceptions. """
    def __init__(self, msg):
        self.msg = msg

def get_parser(parser):
    """
    Return an instance of a parser, given the dotted
    Python import path (as a string) to the backend class.
    
    If the parser cannot be located (e.g., because no such module
    exists, or because the module does not contain a class of the
    appropriate name)
    
    """
    
    i = parser.rfind('.')
    module, attr = parser[:i], parser[i+1:]
    try:
        mod = import_module(module)
    except ImportError, e:
        raise ImproperlyConfigured('Error loading registration backend %s: "%s"' % (module, e))
    try:
        backend_class = getattr(mod, attr)
    except AttributeError:
        print 'Module "%s" does not define a notification backend named "%s"' % (module, attr)
        raise ImproperlyConfigured('Module "%s" does not define a notification backend named "%s"' % (module, attr))
    return backend_class()