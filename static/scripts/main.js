(function() {
  var Amazeballs, Ball, DebugView, Draw, Socket, World;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Amazeballs = (function() {
    function Amazeballs() {
      this.createSockets = __bind(this.createSockets, this);;
      this.newBall_right = __bind(this.newBall_right, this);;
      this.newBall_left = __bind(this.newBall_left, this);;      var self;
      this.canvas = $('#canvas');
      this.balls = [];
      this.draw = new Draw(this);
      this.world = new World(this);
      this.createSockets();
      self = this;
      this.debugView = new DebugView(this);
      this.colours = ['#F9E4AD', '#E6B098', '#CC4452', '#723147', '#31152B'];
      this.loop = window.setInterval((function() {
        return self.draw.update();
      }), 1000 / 40);
    }
    Amazeballs.prototype.rand = function(from, to) {
      return Math.floor(Math.random() * (to - from + 1) + from);
    };
    Amazeballs.prototype.newBall_left = function() {
      var ball, radius, x;
      x = 0;
      radius = this.rand(3, 10) * 0.1;
      ball = new Ball(this, radius, x, 1, [10, 0], {
        'colour': this.colours[this.rand(0, 4)]
      });
      return this.balls.push(ball);
    };
    Amazeballs.prototype.newBall_right = function() {
      var ball, radius, x;
      x = 29;
      radius = this.rand(3, 10) * 0.1;
      ball = new Ball(this, radius, x, 1, [-10, 0], {
        'colour': this.colours[this.rand(0, 4)]
      });
      return this.balls.push(ball);
    };
    Amazeballs.prototype.createSockets = function() {
      var self;
      self = this;
      return jQuery.each(jQuery.parseJSON($('#hosts').text()), function(index, host) {
        return self.socket = new Socket(self, "" + host);
      });
    };
    return Amazeballs;
  })();
  Socket = (function() {
    function Socket(parent, host) {
      var self;
      this.parent = parent;
      this.host = host;
      this.handleData = __bind(this.handleData, this);;
      this.close = __bind(this.close, this);;
      this.send = __bind(this.send, this);;
      self = this;
      this.requests = 0;
      this.host = this.host;
      this.parent = this.parent;
      this.socket = new WebSocket("ws://localhost:8888" + this.host);
      this.socket.onopen = function() {
        return this.send('{"connection":true,"connection_type":"client"}');
      };
      this.socket.onmessage = function(event) {
        return self.handleData(event.data);
      };
      this.socket.onclose = function() {
        return console.log('onclose');
      };
      this.socket.onopen = function() {
        return console.log('onopen');
      };
    }
    Socket.prototype.send = function(message) {
      message = jQuery.parseJSON(message);
      return this.socket.send(message);
    };
    Socket.prototype.close = function() {
      return this.socket.close();
    };
    Socket.prototype.handleData = function(data) {
      this.requests += 1;
      $('#debug .requests').html("" + this.requests + " requests");
      data = jQuery.parseJSON(data);
      console.log(data);
      return this.parent.newBall_left();
    };
    return Socket;
  })();
  World = (function() {
    function World(parent) {
      this.parent = parent;
      this.create();
    }
    World.prototype.add = function(object) {};
    World.prototype.create = function() {
      var bodyDef, fixDef;
      this.gravity = new Box2D.Common.Math.b2Vec2(0, 10);
      this.world = new Box2D.Dynamics.b2World(this.gravity, true);
      fixDef = new Box2D.Dynamics.b2FixtureDef;
      bodyDef = new Box2D.Dynamics.b2BodyDef;
      bodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody;
      fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
      fixDef.shape.SetAsBox(30, 0.033);
      bodyDef.position.Set(0, 25);
      this.world.CreateBody(bodyDef).CreateFixture(fixDef);
      bodyDef.position.Set(0, 0);
      this.world.CreateBody(bodyDef).CreateFixture(fixDef);
      fixDef.shape.SetAsBox(0.033, 30);
      bodyDef.position.Set(0, 13);
      this.world.CreateBody(bodyDef).CreateFixture(fixDef);
      bodyDef.position.Set(30, 0);
      return this.world.CreateBody(bodyDef).CreateFixture(fixDef);
    };
    return World;
  })();
  Draw = (function() {
    function Draw(parent) {
      this.parent = parent;
      this.lastTime = new Date();
      this.timeStep = 1 / 30;
      this.frameCount = 0;
      this.fps = 0;
      this.context = this.parent.canvas[0].getContext("2d");
    }
    Draw.prototype.updateFps = function() {
      var now;
      now = new Date();
      if (Math.ceil(now.getTime() - this.lastTime.getTime()) >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0.0;
        this.lastTime = now;
      }
      this.frameCount++;
      return $('#debug .fps').html("" + this.fps + " fps");
    };
    Draw.prototype.update = function() {
      console.log('Draw.update()');
      this.updateFps();
      this.parent.world.world.Step(this.timeStep, 10, 10);
      this.parent.world.world.ClearForces();
      return this.drawWorld(this.parent.world.world, this.context);
    };
    Draw.prototype.drawWorld = function(world, context) {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      for (var body = world.m_bodyList; body; body = body.m_next) {
            for (var fixture = body.m_fixtureList; fixture != null; fixture = fixture.m_next) {
                this.drawShape(fixture, context);
            }
        };
      return false;
    };
    Draw.prototype.drawShape = function(fixture, context) {
      var position, radius, userData;
      if (fixture.m_shape.m_radius) {
        userData = fixture.m_body.GetUserData();
        position = fixture.m_body.GetPosition();
        radius = fixture.m_shape.m_radius * 30;
        context.beginPath();
        if (userData && userData['colour']) {
          context.fillStyle = userData['colour'];
        }
        context.arc(position.x * 30, position.y * 30, radius, 0, Math.PI * 2, false);
        context.fill();
        return context.moveTo(position.x * 30, position.y * 30);
      }
    };
    return Draw;
  })();
  Ball = (function() {
    function Ball(parent, radius, x, y, velocity, userdata) {
      var self;
      this.parent = parent;
      this.radius = radius;
      this.x = x;
      this.y = y;
      this.velocity = velocity;
      this.userdata = userdata;
      self = this;
      this.create();
      window.setInterval((function() {
        return self.destroy();
      }), 15000);
    }
    Ball.prototype.destroy = function() {
      return this.parent.world.world.DestroyBody(this.body.m_body);
    };
    Ball.prototype.create = function() {
      var bodyDef, fixDef;
      fixDef = new Box2D.Dynamics.b2FixtureDef();
      fixDef.density = 1.0;
      fixDef.friction = 0.20;
      fixDef.restitution = 0.4;
      bodyDef = new Box2D.Dynamics.b2BodyDef();
      bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
      fixDef.shape = new Box2D.Collision.Shapes.b2CircleShape(this.radius);
      bodyDef.position.x = this.x;
      bodyDef.position.y = this.y;
      bodyDef.linearVelocity = new Box2D.Common.Math.b2Vec2(this.velocity[0], this.velocity[1]);
      bodyDef.userData = this.userdata;
      return this.body = this.parent.world.world.CreateBody(bodyDef).CreateFixture(fixDef);
    };
    return Ball;
  })();
  DebugView = (function() {
    function DebugView(parent) {
      this.parent = parent;
      console.log('DebugView.constructor()');
      this.debugDraw = new Box2D.Dynamics.b2DebugDraw();
      this.debugDraw.SetSprite(this.parent.canvas[0].getContext("2d"));
      this.debugDraw.SetDrawScale(30.0);
      this.debugDraw.SetFillAlpha(0.5);
      this.debugDraw.SetLineThickness(5.0);
      this.debugDraw.SetFlags(Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit);
      this.parent.world.world.SetDebugDraw(this.debugDraw);
    }
    return DebugView;
  })();
  $(function() {
    var surface;
    return surface = new Amazeballs();
  });
}).call(this);
