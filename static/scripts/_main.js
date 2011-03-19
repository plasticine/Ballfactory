(function() {
  var Amazeballs, Ball, Box, Draw, World;
  Amazeballs = (function() {
    function Amazeballs(target, options) {
      var ball;
      this.target = target;
      this.options = options;
      this.canvas = $('#canvas');
      this.balls = [];
      this.draw = new Draw(this);
      this.world = new World(this);
      ball = new Ball(100, 200, 200);
      this.world.add(ball);
      this.balls.push(ball);
      setInterval(this.draw.update(), 1000 / 40);
    }
    Amazeballs.prototype.createSockets = function() {
      this.socket = new WebSocket("ws://localhost:8888/test");
      this.socket.onopen = function() {
        return ws.send("This is a message from the browser to the server");
      };
      return this.socket.onmessage = function(event) {
        return alert("The server sent a message: " + event.data);
      };
    };
    return Amazeballs;
  })();
  World = (function() {
    function World(parent) {
      this.parent = parent;
      this.world = null;
      this.bounds = [];
      this.wallThickness = 1;
      this.create();
    }
    World.prototype.add = function(object) {
      console.log(object);
      if (object.element) {
        object.element.appendTo(this.parent.canvas);
      }
      this.world.CreateBody(object.body);
      return;
    };
    World.prototype.create = function() {
      this.worldAABB = new b2AABB();
      this.worldAABB.minVertex.Set(0, 0);
      this.worldAABB.maxVertex.Set(screen.width, screen.height);
      this.world = new b2World(this.worldAABB, new b2Vec2(0, 0), true);
      return this.createBounds();
    };
    World.prototype.createBounds = function() {
      var stage;
      stage = [window.screenX, window.screenY, window.innerWidth, window.innerHeight];
      this.bounds[0] = this.add(new Box(stage[2] / 2, -this.wallThickness, stage[2], this.wallThickness));
      this.bounds[1] = this.add(new Box(stage[2] / 2, stage[3] + this.wallThickness, stage[2], this.wallThickness));
      this.bounds[2] = this.add(new Box(-this.wallThickness, stage[3] / 2, this.wallThickness, stage[3]));
      return this.bounds[3] = this.add(new Box(stage[2] + this.wallThickness, stage[3] / 2, this.wallThickness, stage[3]));
    };
    return World;
  })();
  Draw = (function() {
    function Draw(parent) {
      this.parent = parent;
      this.parent = this.parent;
      this.delta = [];
      this.iterations = 0;
      this.fps = 0;
      this.frameCount = 0;
      this.timeStep = 1 / 20;
      this.lastTime = new Date();
      this.orientation = {
        x: 0,
        y: 1
      };
    }
    Draw.prototype.update = function() {
      var ball, _i, _len, _ref, _results;
      console.log('update()');
      this.delta[0] += (0 - this.delta[0]) / 2;
      this.delta[1] += (0 - this.delta[1]) / 2;
      this.parent.world.world.m_gravity.x = this.orientation.x * 350 + this.delta[0];
      this.parent.world.world.m_gravity.y = this.orientation.y * 350 + this.delta[1];
      this.parent.world.world.DrawDebugData();
      this.parent.world.world.ClearForces();
      this.parent.world.world.Step(1 / 30, 10, 10);
      _ref = this.parent.balls;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ball = _ref[_i];
        _results.push($(ball.element[0]).css({
          'left': ball.body.position.x - (ball.element[0].width >> 1),
          'top': ball.body.position.y - (ball.element[0].height >> 1)
        }));
      }
      return _results;
    };
    Draw.prototype.fps = function() {
      var fps, frameCount, now;
      now = new Date();
      if (Math.ceil(now.getTime() - this.lastTime.getTime()) >= 1000) {
        fps = frameCount;
        frameCount = 0.0;
        this.lastTime = now;
      }
      this.frameCount++;
      return $('#fps').html("" + fps + "fps");
    };
    return Draw;
  })();
  Box = (function() {
    function Box(x, y, width, height, fixed) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.fixed = fixed;
      console.log('create new box object:', this.x, this.y, this.width, this.height, this.fixed);
      this.body = null;
      this.create();
      return this;
    }
    Box.prototype.create = function() {
      var box, fixed;
      this.element = false;
      if (typeof this.fixed === 'undefined') {
        fixed = true;
      }
      box = new b2BoxDef();
      box.extents.Set(this.width, this.height);
      if (!fixed) {
        box.density = 1.0;
      }
      this.body = new b2BodyDef();
      this.body.AddShape(box);
      return this.body.position.Set(this.x, this.y);
    };
    return Box;
  })();
  Ball = (function() {
    function Ball(size, x, y) {
      this.size = size;
      this.x = x;
      this.y = y;
      console.log('create new ball object:', this.size, this.x, this.y);
      this.body = null;
      this.create();
      this.fill();
      this.newtonize();
      return this;
    }
    Ball.prototype.create = function() {
      this.element = $('<canvas>');
      this.element[0].width = this.size;
      this.element[0].height = this.size;
      return this.element.css({
        'position': 'absolute',
        'left': this.x,
        'top': this.y
      });
    };
    Ball.prototype.fill = function() {
      var graphics;
      graphics = this.element[0].getContext('2d');
      graphics.fillStyle = "#000000";
      graphics.beginPath();
      graphics.arc(this.size / 2, this.size / 2, this.size / 2, 0, Math.PI * 2, true);
      graphics.closePath();
      return graphics.fill();
    };
    Ball.prototype.newtonize = function() {
      var body, circle;
      circle = new b2CircleDef();
      circle.radius = this.size >> 1;
      circle.density = 1;
      circle.friction = 0.3;
      circle.restitution = 0.3;
      body = new b2BodyDef();
      body.AddShape(circle);
      body.userData = {
        'element': this.element
      };
      body.position.Set(this.x, this.y);
      body.linearVelocity.Set(Math.random() * 400 - 200, Math.random() * 400 - 200);
      return this.body = body;
    };
    return Ball;
  })();
  $(function() {
    var surface;
    return surface = Amazeballs();
  });
}).call(this);
