var PhysicsWorker, onmessage, worker;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
importScripts('/static/scripts/json2.js', '/static/scripts/box2d.min.js');
PhysicsWorker = (function() {
  function PhysicsWorker() {
    this.stepWorld = __bind(this.stepWorld, this);;
    this.loop = __bind(this.loop, this);;
    this.updateState = __bind(this.updateState, this);;
    this.checkTTL = __bind(this.checkTTL, this);;
    this.fps = __bind(this.fps, this);;
    this.update = __bind(this.update, this);;
    this.addBall = __bind(this.addBall, this);;
    this.add = __bind(this.add, this);;
    this.buildWorld = __bind(this.buildWorld, this);;
    this.initWorld = __bind(this.initWorld, this);;    this.state = false;
    this.world = false;
    this.walls = {};
    this.bodyTypes = ['static', 'kinematic', 'dynamic'];
    this.shapeTypes = ['circle', 'polygon'];
    this.loopTimer = false;
    this.updateTimer = false;
    this.physicsScale = 15;
    this.ballMaxTTL = 10 * 60 * 1000;
    this.ballTTL = 1000 * 1;
    this.velocityIterationsPerSecond = 300;
    this.positionIterationsPerSecond = 200;
    this.fpsTarget = 50;
    this.fpsActual = 0;
    this.frames = 0;
    this.lastUpdate = 0;
    this.initWorld();
    this.buildWorld();
    this.updateState();
    this.checkTTL();
    this.update();
    this.loop();
  }
  PhysicsWorker.prototype.initWorld = function() {
    this.world = new b2World(new b2Vec2(0.0, 9.81), true);
    return this.world.SetWarmStarting(true);
  };
  PhysicsWorker.prototype.buildWorld = function() {
    var wall, wallBody;
    wall = new b2PolygonShape();
    wallBody = new b2BodyDef();
    wall.SetAsBox(0.5 / this.physicsScale, 600 / this.physicsScale);
    wallBody.position.Set(0 / this.physicsScale, 0 / this.physicsScale);
    this.walls['left'] = this.world.CreateBody(wallBody);
    this.walls['left'].CreateFixture2(wall);
    wallBody.position.Set(850 / this.physicsScale, 0 / this.physicsScale);
    this.walls['right'] = this.world.CreateBody(wallBody);
    this.walls['right'].CreateFixture2(wall);
    wall.SetAsBox(850 / this.physicsScale, 0.5 / this.physicsScale);
    wallBody.position.Set(0 / this.physicsScale, 600 / this.physicsScale);
    this.walls['bottom'] = this.world.CreateBody(wallBody);
    return this.walls['bottom'].CreateFixture2(wall);
  };
  PhysicsWorker.prototype.add = function(balls) {
    var ball, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = balls.length; _i < _len; _i++) {
      ball = balls[_i];
      _results.push(this.addBall(ball.radius, ball.colour));
    }
    return _results;
  };
  PhysicsWorker.prototype.addBall = function(radius, colour) {
    var ball, ballBody, fixture, x;
    fixture = new b2FixtureDef();
    fixture.shape = new b2CircleShape(radius / this.physicsScale);
    fixture.friction = 0.35;
    fixture.restitution = 0.2;
    fixture.density = 10.0;
    ballBody = new b2BodyDef();
    ballBody.type = b2Body.b2_dynamicBody;
    x = (750 / 2) - radius / 2;
    ballBody.position.Set(x / this.physicsScale, (-100 / this.physicsScale) * (Math.random()));
    ball = this.world.CreateBody(ballBody);
    ball.SetUserData({
      'colour': colour,
      'spawn_time': new Date().getTime()
    });
    return ball.CreateFixture(fixture);
  };
  PhysicsWorker.prototype.update = function() {
    this.fps();
    postMessage(JSON.stringify({
      'action': 'update',
      'fps': this.fpsActual,
      'ttl': this.ballTTL
    }));
    return setTimeout((__bind(function() {
      return this.update();
    }, this)), 1000);
  };
  PhysicsWorker.prototype.fps = function() {
    this.fpsActual = this.frames;
    return this.frames = 0;
  };
  PhysicsWorker.prototype.checkTTL = function() {
    var delta;
    if (this.fpsActual < 80 && this.ballTTL > 5000) {
      delta = 100 * (80 - this.fpsActual);
      if (delta < this.ballTTL) {
        this.ballTTL -= delta;
      } else if (delta < 0) {
        this.ballTTL = 2500;
      }
    }
    if (this.fpsActual > 80 && this.ballTTL < this.ballMaxTTL) {
      this.ballTTL += 10 * (this.fpsActual - 0);
    }
    return setTimeout((__bind(function() {
      return this.checkTTL();
    }, this)), 100);
  };
  PhysicsWorker.prototype.updateState = function() {
    var body, fixture, now, shape, user_data, _body;
    this.state = [];
    now = new Date().getTime();
    body = this.world.GetBodyList();
    while (body !== null) {
      user_data = body.GetUserData();
      if (user_data && (now - user_data['spawn_time']) > this.ballTTL) {
        this.world.DestroyBody(body);
      } else {
        _body = {};
        _body.position = body.GetPosition();
        _body.angle = body.GetAngle();
        if (user_data) {
          _body.colour = user_data['colour'];
        }
        _body.bodytype = this.bodyTypes[body.GetType()];
        _body.shape = {};
        fixture = body.GetFixtureList();
        while (fixture !== null) {
          shape = fixture.GetShape();
          _body.shape.type = this.shapeTypes[shape.GetType()];
          switch (_body.shape.type) {
            case 'polygon':
              _body.shape.vertices = shape.GetVertices();
              break;
            case 'circle':
              _body.shape.radius = shape.GetRadius();
          }
          fixture = fixture.GetNext();
        }
        this.state.push(_body);
      }
      body = body.GetNext();
    }
    postMessage(JSON.stringify({
      'action': 'state',
      'state': this.state
    }));
    return this.stateTimer = setTimeout((__bind(function() {
      return this.updateState();
    }, this)), 1000 / 100);
  };
  PhysicsWorker.prototype.loop = function() {
    var delta, now;
    clearTimeout(this.loopTimer);
    now = new Date().getTime();
    delta = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;
    if (delta > 10) {
      delta = 1 / this.fpsTarget;
    }
    this.stepWorld(delta);
    this.frames++;
    return this.loopTimer = setTimeout((__bind(function() {
      return this.loop();
    }, this)));
  };
  PhysicsWorker.prototype.stepWorld = function(delta) {
    this.world.ClearForces();
    return this.world.Step(delta, delta * this.velocityIterationsPerSecond, delta * this.positionIterationsPerSecond);
  };
  return PhysicsWorker;
})();
worker = null;
onmessage = function(event) {
  var message;
  message = JSON.parse(event.data);
  switch (message.action) {
    case 'start':
      return worker = new PhysicsWorker();
    case 'add':
      return worker.add(message.balls);
  }
};