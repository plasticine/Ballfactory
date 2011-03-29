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
      this.viewport = new WebGLViewport(this);
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
      this.viewportScale = 20;
      this.fpsTarget = 1000 / 50;
      this.width = 0;
      this.height = 0;
      this.loopTimer = false;
      this.framerateTimer = false;
      this.fpsActual = 0;
      this.frames = 0;
      this.lastUpdate = 0;
      this.fps();
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
      }, this)), this.fpsTarget);
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
    __extends(CanvasViewport, Viewport);
    function CanvasViewport(parent) {
      this.parent = parent;
      this.draw = __bind(this.draw, this);;
      CanvasViewport.__super__.constructor.call(this, this.parent);
      this.context = this.canvas[0].getContext("2d");
      this.loop();
    }
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
    __extends(WebGLViewport, Viewport);
    function WebGLViewport(parent) {
      this.parent = parent;
      this.draw = __bind(this.draw, this);;
      this.drawCircle = __bind(this.drawCircle, this);;
      this.drawBox = __bind(this.drawBox, this);;
      this.setColour = __bind(this.setColour, this);;
      this.reshapeViewport = __bind(this.reshapeViewport, this);;
      this.initDraw = __bind(this.initDraw, this);;
      this.createShader = __bind(this.createShader, this);;
      this.initShaders = __bind(this.initShaders, this);;
      this.setMVMatrixUniform = __bind(this.setMVMatrixUniform, this);;
      this.setPMatrixUniform = __bind(this.setPMatrixUniform, this);;
      this.createCircleShapeVbo = __bind(this.createCircleShapeVbo, this);;
      this.createBoxShapeVbo = __bind(this.createBoxShapeVbo, this);;
      this.createStaticShapeVbo = __bind(this.createStaticShapeVbo, this);;
      WebGLViewport.__super__.constructor.call(this, this.parent);
      this.gl = WebGLUtils.create3DContext(this.canvas[0], null);
      this.mvMatrix = mat3.create();
      this.pMatrix = mat3.create();
      this.circleDetail = 16;
      this.circleEdges = 32;
      this.circleShapeVbo = this.createCircleShapeVbo();
      this.boxShapeVbo = this.createBoxShapeVbo();
      this.initShaders();
      this.initDraw();
      this.reshapeViewport();
      this.loop();
    }
    WebGLViewport.prototype.createStaticShapeVbo = function(vertices, itemSize, numItems) {
      var vbo;
      vbo = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
      return {
        numItems: numItems,
        bind: __bind(function(vertexPositionAttribute) {
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
          return this.gl.vertexAttribPointer(vertexPositionAttribute, itemSize, this.gl.FLOAT, false, 0, 0);
        }, this)
      };
    };
    WebGLViewport.prototype.createBoxShapeVbo = function() {
      var vbo, vertices;
      vertices = [-1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
      vbo = this.createStaticShapeVbo(vertices, 2, 5);
      return {
        bind: vbo.bind,
        fill: __bind(function() {
          return this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
        }, this),
        stroke: __bind(function() {
          return this.gl.drawArrays(this.gl.LINE_STRIP, 0, 5);
        }, this)
      };
    };
    WebGLViewport.prototype.createCircleShapeVbo = function() {
      var angle, i, step, vbo, vertices, _ref;
      vertices = [0.0, 0.0];
      step = 2.0 * Math.PI / this.circleEdges;
      for (i = 0, _ref = this.circleEdges; (0 <= _ref ? i < _ref : i > _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        angle = step * i;
        vertices[i * 2 + 2] = Math.cos(angle);
        vertices[i * 2 + 3] = Math.sin(angle);
      }
      vertices[this.circleEdges * 2 + 2] = vertices[2];
      vertices[this.circleEdges * 2 + 3] = vertices[3];
      vbo = this.createStaticShapeVbo(vertices, 2, this.circleEdges + 2);
      return {
        bind: vbo.bind,
        fill: __bind(function() {
          return this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, this.circleEdges + 2);
        }, this),
        stroke: __bind(function() {
          return this.gl.drawArrays(this.gl.LINE_STRIP, 1, this.circleEdges + 1);
        }, this),
        destroy: __bind(function() {
          try {
            return this.gl.deleteBuffer(vbo);
          } catch (error) {
            return console.log(error);
          }
        }, this)
      };
    };
    WebGLViewport.prototype.setPMatrixUniform = function() {
      return this.gl.uniformMatrix3fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
    };
    WebGLViewport.prototype.setMVMatrixUniform = function() {
      return this.gl.uniformMatrix3fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
    };
    WebGLViewport.prototype.initShaders = function() {
      var fragmentShader, fragment_shader_src, vertexShader, vertex_shader_src;
      vertex_shader_src = ['attribute vec3 aVertexPosition;', 'uniform mat3 uMVMatrix;', 'uniform mat3 uPMatrix;', 'void main(void) {', '    vec2 vPos = vec2(aVertexPosition);', '    vec3 pos = uPMatrix * uMVMatrix * vec3(vPos, 1.0);', '    gl_Position = vec4(pos, 1.0);', '}'].join('\n');
      fragment_shader_src = ['#ifdef GL_ES', 'precision highp float;', '#endif', 'uniform vec4 uColor;', 'void main(void) {', '    gl_FragColor = uColor;', '}'].join('\n');
      vertexShader = this.createShader(vertex_shader_src, this.gl.VERTEX_SHADER);
      fragmentShader = this.createShader(fragment_shader_src, this.gl.FRAGMENT_SHADER);
      this.shaderProgram = this.gl.createProgram();
      this.gl.attachShader(this.shaderProgram, vertexShader);
      this.gl.attachShader(this.shaderProgram, fragmentShader);
      this.gl.linkProgram(this.shaderProgram);
      this.gl.useProgram(this.shaderProgram);
      this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
      this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
      this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
      this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
      return this.shaderProgram.glColorUniform = this.gl.getUniformLocation(this.shaderProgram, "uColor");
    };
    WebGLViewport.prototype.createShader = function(src, type) {
      var shader;
      shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, src);
      this.gl.compileShader(shader);
      return shader;
    };
    WebGLViewport.prototype.initDraw = function() {
      return this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    };
    WebGLViewport.prototype.reshapeViewport = function() {
      var height, width;
      width = this.canvas.width();
      height = this.canvas.height();
      this.gl.viewport(0, 0, width, height);
      mat3.ortho2D(this.pMatrix, width, 0, height, 0);
      return this.setPMatrixUniform();
    };
    WebGLViewport.prototype.setColour = function(r, g, b) {
      return this.gl.uniform4f(this.shaderProgram.glColorUniform, r, g, b, 1.0);
    };
    WebGLViewport.prototype.drawBox = function(x, y, width, height, angle, colour) {
      mat3.identity(this.mvMatrix);
      mat3.translate(this.mvMatrix, this.scale(x), this.scale(y));
      mat3.rotate(this.mvMatrix, angle);
      mat3.scale(this.mvMatrix, this.scale(width), this.scale(height));
      this.setMVMatrixUniform();
      this.boxShapeVbo.bind();
      this.setColour(0.0, 0.0, 0.0);
      return this.boxShapeVbo.fill();
    };
    WebGLViewport.prototype.drawCircle = function(x, y, radius, colour) {
      mat3.identity(this.mvMatrix);
      mat3.translate(this.mvMatrix, this.scale(x), this.scale(y));
      mat3.scale(this.mvMatrix, this.scale(radius), this.scale(radius));
      this.setMVMatrixUniform();
      this.circleShapeVbo.bind();
      this.setColour(0.0, 0.0, 0.0);
      return this.circleShapeVbo.stroke();
    };
    WebGLViewport.prototype.draw = function() {
      var drawable, height, width, _i, _len, _ref, _results;
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      _ref = this.parent.drawables;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        drawable = _ref[_i];
        _results.push((function() {
          switch (drawable.shape.type) {
            case 'polygon':
              width = Math.abs(drawable.shape.vertices[0].x) + Math.abs(drawable.shape.vertices[1].x);
              height = Math.abs(drawable.shape.vertices[1].y) + Math.abs(drawable.shape.vertices[2].y);
              return this.drawBox(drawable.position.x, drawable.position.y, width, height, drawable.angle, [0, 0, 0]);
            case 'circle':
              return this.drawCircle(drawable.position.x, drawable.position.y, drawable.shape.radius, [0, 0, 0]);
          }
        }).call(this));
      }
      return _results;
    };
    return WebGLViewport;
  })();
  jQuery(function() {
    return window.engine = new Engine();
  });
}).call(this);
