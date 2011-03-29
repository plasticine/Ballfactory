var PhysicsWorker, onmessage, worker;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
importScripts('/static/scripts/json2.js', '/static/scripts/box2d.min.js');
PhysicsWorker = (function() {
  function PhysicsWorker() {
    this.stepWorld = __bind(this.stepWorld, this);;
    this.loop = __bind(this.loop, this);;
    this.updateState = __bind(this.updateState, this);;
    this.fps = __bind(this.fps, this);;
    this.addBall = __bind(this.addBall, this);;
    this.buildWorld = __bind(this.buildWorld, this);;
    this.initWorld = __bind(this.initWorld, this);;    this.state = false;
    this.world = false;
    this.walls = {};
    this.bodyTypes = ['static', 'kinematic', 'dynamic'];
    this.shapeTypes = ['circle', 'polygon'];
    this.loopTimer = false;
    this.framerateTimer = false;
    this.physicsScale = 20;
    this.velocityIterationsPerSecond = 300;
    this.positionIterationsPerSecond = 200;
    this.fpsTarget = 200;
    this.fpsActual = 0;
    this.frames = 0;
    this.lastUpdate = 0;
    this.initWorld();
    this.buildWorld();
    this.updateState();
    this.fps();
    this.loop();
    /* Testing
    */
    this.addBall(20);
    this.addBall(10);
    this.addBall(16);
    this.addBall(20);
    this.addBall(14);
    this.addBall(10);
    this.addBall(4);
    this.addBall(4);
    this.addBall(2);
    this.addBall(9);
    this.addBall(28);
    this.addBall(38);
    this.addBall(18);
    this.addBall(4);
    this.addBall(34);
    this.addBall(23);
    this.addBall(36);
    this.addBall(20);
    this.addBall(10);
    this.addBall(28);
    this.addBall(5);
    this.addBall(38);
    this.addBall(7);
    this.addBall(26);
    this.addBall(20);
    this.addBall(10);
    this.addBall(28);
  }
  PhysicsWorker.prototype.initWorld = function() {
    this.world = new b2World(new b2Vec2(0.0, 9.81), true);
    return this.world.SetWarmStarting(true);
  };
  PhysicsWorker.prototype.buildWorld = function() {
    var wall, wallBody;
    wall = new b2PolygonShape();
    wallBody = new b2BodyDef();
    wall.SetAsBox(1 / this.physicsScale, 600 / this.physicsScale);
    wallBody.position.Set(0 / this.physicsScale, 0 / this.physicsScale);
    this.walls['left'] = this.world.CreateBody(wallBody);
    this.walls['left'].CreateFixture2(wall);
    wallBody.position.Set(848 / this.physicsScale, 0 / this.physicsScale);
    this.walls['right'] = this.world.CreateBody(wallBody);
    this.walls['right'].CreateFixture2(wall);
    wall.SetAsBox(850 / this.physicsScale, 1 / this.physicsScale);
    wallBody.position.Set(0 / this.physicsScale, 598 / this.physicsScale);
    this.walls['bottom'] = this.world.CreateBody(wallBody);
    return this.walls['bottom'].CreateFixture2(wall);
  };
  PhysicsWorker.prototype.addBall = function(radius) {
    var ball, ballBody, fixture, x;
    fixture = new b2FixtureDef();
    fixture.shape = new b2CircleShape(radius / this.physicsScale);
    fixture.friction = 0.45;
    fixture.restitution = 0.5;
    fixture.density = 1.0;
    ballBody = new b2BodyDef();
    ballBody.type = b2Body.b2_dynamicBody;
    x = (750 / 2) - radius / 2;
    ballBody.position.Set(x / this.physicsScale, (-100 / this.physicsScale) * (Math.random()));
    ball = this.world.CreateBody(ballBody);
    return ball.CreateFixture(fixture);
  };
  PhysicsWorker.prototype.fps = function() {
    this.fpsActual = this.frames;
    this.frames = 0;
    postMessage(JSON.stringify({
      'action': 'fps',
      'fps': this.fpsActual
    }));
    return this.framerateTimer = setTimeout((__bind(function() {
      return this.fps();
    }, this)), 1000);
  };
  PhysicsWorker.prototype.updateState = function() {
    var body, fixture, shape, _body;
    this.state = [];
    body = this.world.GetBodyList();
    while (body !== null) {
      _body = {};
      _body.position = body.GetPosition();
      _body.angle = body.GetAngle();
      _body.type = this.bodyTypes[body.GetType()];
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
      body = body.GetNext();
    }
    return postMessage(JSON.stringify({
      'action': 'state',
      'state': this.state
    }));
  };
  PhysicsWorker.prototype.loop = function() {
    var delta, now;
    now = new Date().getTime();
    delta = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;
    if (delta > 10) {
      delta = 1 / this.fpsTarget;
    }
    this.stepWorld(delta);
    this.updateState();
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
      return worker.add(event.data.objects);
  }
};