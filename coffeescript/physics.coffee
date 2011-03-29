importScripts('/static/scripts/json2.js', '/static/scripts/box2d.min.js')

class PhysicsWorker
    constructor: ->
        this.state = false
        this.world = false
        this.walls = {}
        this.bodyTypes = ['static', 'kinematic', 'dynamic']
        this.shapeTypes = ['circle', 'polygon']
        this.loopTimer = false
        this.framerateTimer = false
        this.physicsScale = 20
        this.velocityIterationsPerSecond = 300
        this.positionIterationsPerSecond = 200
        this.fpsTarget = 200
        this.fpsActual = 0
        this.frames = 0
        this.lastUpdate = 0
        this.initWorld()
        this.buildWorld()
        this.updateState()
        this.fps()
        this.loop()
        
        ### Testing
        ################################
        this.addBall(20)
        this.addBall(10)
        this.addBall(16)
        this.addBall(20)
        this.addBall(14)
        this.addBall(10)
        this.addBall(4)
        this.addBall(4)
        this.addBall(2)
        this.addBall(9)
        this.addBall(28)
        this.addBall(38)
        this.addBall(18)
        this.addBall(4)
        this.addBall(34)
        this.addBall(23)
        this.addBall(36)
        this.addBall(20)
        this.addBall(10)
        this.addBall(28)
        this.addBall(5)
        this.addBall(38)
        this.addBall(7)
        this.addBall(26)
        this.addBall(20)
        this.addBall(10)
        this.addBall(28)
        ################################
    
    initWorld: =>
        this.world = new b2World(new b2Vec2(0.0, 9.81), true)
        this.world.SetWarmStarting(true)
    
    buildWorld: =>
        wall = new b2PolygonShape()
        wallBody = new b2BodyDef()
        
        wall.SetAsBox((1 / @physicsScale), (600 / @physicsScale))
        # Left
        wallBody.position.Set((0 / @physicsScale), (0 / @physicsScale))
        @walls['left'] = @world.CreateBody(wallBody)
        @walls['left'].CreateFixture2(wall)
        # Right
        wallBody.position.Set((848 / @physicsScale), (0 / @physicsScale))
        @walls['right'] = @world.CreateBody(wallBody)
        @walls['right'].CreateFixture2(wall)
        
        wall.SetAsBox((850 / @physicsScale), (1 / @physicsScale))
        # Top
        # wallBody.position.Set((0 / @physicsScale), (0 / @physicsScale))
        # @walls['top'] = @world.CreateBody(wallBody)
        # @walls['top'].CreateFixture2(wall)
        # Bottom
        wallBody.position.Set((0 / @physicsScale), (598 / @physicsScale))
        @walls['bottom'] = @world.CreateBody(wallBody)
        @walls['bottom'].CreateFixture2(wall)
    
    addBall: (radius) =>
        fixture = new b2FixtureDef()
        fixture.shape = new b2CircleShape(radius / @physicsScale);
        fixture.friction = 0.45;
        fixture.restitution = 0.5;
        fixture.density = 1.0;
        ballBody = new b2BodyDef()
        ballBody.type = b2Body.b2_dynamicBody
        x = (750 / 2) - radius/2
        ballBody.position.Set((x / @physicsScale), (-100 / @physicsScale) * (Math.random()))
        ball = @world.CreateBody(ballBody)
        ball.CreateFixture(fixture)
    
    fps: =>
        @fpsActual = @frames
        @frames = 0
        postMessage(JSON.stringify({
            'action':'fps',
            'fps':@fpsActual
        }))
        @framerateTimer = setTimeout(( => @fps() ), 1000)
    
    updateState: =>
        @state = []
        body = this.world.GetBodyList()
        while body != null
            _body = {}
            _body.position = body.GetPosition()
            _body.angle = body.GetAngle()
            _body.type = @bodyTypes[body.GetType()]
            _body.shape = {}
            fixture = body.GetFixtureList()
            while fixture != null
                shape = fixture.GetShape()
                _body.shape.type = @shapeTypes[shape.GetType()]
                switch _body.shape.type
                    when 'polygon'
                        _body.shape.vertices = shape.GetVertices()
                    when 'circle'
                        _body.shape.radius = shape.GetRadius()
                fixture = fixture.GetNext()
            @state.push(_body)
            body = body.GetNext()
        postMessage(JSON.stringify({
            'action':'state',
            'state':@state
        }))
    
    loop: =>
        now = new Date().getTime()
        delta = (now - @lastUpdate) / 1000
        @lastUpdate = now
        if delta > 10
            delta = 1 / this.fpsTarget
        
        this.stepWorld(delta)
        this.updateState()
        @frames++
        @loopTimer = setTimeout(( => @loop() ))
    
    stepWorld: (delta) =>
        @world.ClearForces()
        @world.Step(delta, delta * @velocityIterationsPerSecond, delta * @positionIterationsPerSecond)


worker = null
onmessage = (event) ->
    message = JSON.parse(event.data)
    switch message.action
        when 'start'
            worker = new PhysicsWorker()
        when 'add'
            worker.add(event.data.objects)