(function() {
  var CanvasViewport, Engine, Remotes, Viewport, WebGLViewport;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  Engine = (function() {
    function Engine() {
      this.physicsMessage = __bind(this.physicsMessage, this);;      this.drawables = [];
      this.remotes = new Remotes(this);
      this.viewport = new CanvasViewport(this);
      this.physics = new Worker('/static/scripts/physics.js');
      this.physics.onmessage = this.physicsMessage;
      this.physics.onerror = this.physicsError;
      this.physics.postMessage(JSON.stringify({
        'action': 'start'
      }));
    }
    Engine.prototype.physicsMessage = function(event) {
      var message;
      message = JSON.parse(event.data);
      switch (message.action) {
        case 'fps':
          return $('.physics-fps span', '#debug').html("" + message.fps);
        case 'state':
          this.drawables = message.state;
          return $('.objects span', '#debug').html("" + this.drawables.length);
      }
    };
    Engine.prototype.physicsError = function(event) {
      return console.log('physicsError:', event);
    };
    return Engine;
  })();
  Remotes = (function() {
    function Remotes(parent) {
      this.parent = parent;
      this.onclose = __bind(this.onclose, this);;
      this.onopen = __bind(this.onopen, this);;
      this.onmessage = __bind(this.onmessage, this);;
      this.close = __bind(this.close, this);;
      this.open = __bind(this.open, this);;
      this.requests = 0;
      this.hosts = [];
      $.each(JSON.parse($('#hosts').text()), __bind(function(index, host) {
        return this.open(host);
      }, this));
    }
    Remotes.prototype.open = function(host) {
      this.hosts[host] = new WebSocket("ws://localhost:8888" + host);
      this.hosts[host].onmessage = this.onmessage;
      this.hosts[host].onclose = this.onclose;
      return this.hosts[host].onopen = this.onopen;
    };
    Remotes.prototype.close = function() {
      return $.each(this.hosts, __bind(function(index, host) {
        return host.close();
      }, this));
    };
    Remotes.prototype.onmessage = function(event) {
      var data;
      data = JSON.parse(event.data);
      this.requests++;
      return $('.requests span', '#debug').html("" + this.requests);
    };
    Remotes.prototype.onopen = function() {};
    Remotes.prototype.onclose = function() {};
    return Remotes;
  })();
  Viewport = (function() {
    function Viewport(parent) {
      this.parent = parent;
      this.fps = __bind(this.fps, this);;
      this.scale = __bind(this.scale, this);;
      this.loop = __bind(this.loop, this);;
      this.canvas = $('canvas#viewport');
      this.context = this.canvas[0].getContext("2d");
      this.viewportScale = 20;
      this.width = 0;
      this.height = 0;
      this.loopTimer = false;
      this.framerateTimer = false;
      this.fpsActual = 0;
      this.frames = 0;
      this.lastUpdate = 0;
      this.fps();
      this.loop();
    }
    Viewport.prototype.loop = function() {
      var delta, now;
      now = new Date().getTime();
      delta = (now - this.lastUpdate) / 1000;
      this.lastUpdate = now;
      this.draw();
      this.frames++;
      return this.loopTimer = setTimeout((__bind(function() {
        return this.loop();
      }, this)), 1000 / 50);
    };
    Viewport.prototype.scale = function(qty) {
      return qty * this.viewportScale;
    };
    Viewport.prototype.fps = function() {
      this.fpsActual = this.frames;
      this.frames = 0;
      $('.viewport-fps span', '#debug').html("" + this.fpsActual);
      return this.framerateTimer = setTimeout((__bind(function() {
        return this.fps();
      }, this)), 1000);
    };
    return Viewport;
  })();
  CanvasViewport = (function() {
    function CanvasViewport() {
      this.draw = __bind(this.draw, this);;      CanvasViewport.__super__.constructor.apply(this, arguments);
    }
    __extends(CanvasViewport, Viewport);
    CanvasViewport.prototype.draw = function() {
      var drawable, height, width, _i, _len, _ref, _results;
      this.context.clearRect(0, 0, this.canvas.width(), this.canvas.height());
      _ref = this.parent.drawables;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        drawable = _ref[_i];
        this.context.beginPath();
        switch (drawable.shape.type) {
          case 'polygon':
            width = Math.abs(drawable.shape.vertices[0].x) + Math.abs(drawable.shape.vertices[1].x);
            height = Math.abs(drawable.shape.vertices[1].y) + Math.abs(drawable.shape.vertices[2].y);
            this.context.fillRect(this.scale(drawable.position.x), this.scale(drawable.position.y), this.scale(width), this.scale(height));
            break;
          case 'circle':
            this.context.arc(this.scale(drawable.position.x), this.scale(drawable.position.y), this.scale(drawable.shape.radius), 0, Math.PI * 2, false);
        }
        _results.push(this.context.stroke());
      }
      return _results;
    };
    return CanvasViewport;
  })();
  WebGLViewport = (function() {
    function WebGLViewport() {
      this.draw = __bind(this.draw, this);;      WebGLViewport.__super__.constructor.apply(this, arguments);
    }
    __extends(WebGLViewport, Viewport);
    WebGLViewport.prototype.draw = function() {};
    return WebGLViewport;
  })();
  jQuery(function() {
    return window.engine = new Engine();
  });
}).call(this);
