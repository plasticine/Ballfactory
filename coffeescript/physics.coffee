importScripts('/static/scripts/json2.js', '/static/scripts/box2d.min.js')

class PhysicsWorker
    constructor: ->
        this.state = false
        this.world = false
        this.walls = {}
        this.bodyTypes = ['static', 'kinematic', 'dynamic']
        this.shapeTypes = ['circle', 'polygon']
        this.loopTimer = false
        this.updateTimer = false
        this.physicsScale = 15
        this.ballMaxTTL = 10 * 60 * 1000 # 10mins
        this.ballTTL = 1000 * 1 # 1 seconds
        this.velocityIterationsPerSecond = 300
        this.positionIterationsPerSecond = 200
        this.fpsTarget = 50
        this.fpsActual = 0
        this.frames = 0
        this.lastUpdate = 0
        this.initWorld()
        this.buildWorld()
        this.updateState()
        this.checkTTL()
        this.update()
        this.loop()
    
    initWorld: =>
        this.world = new b2World(new b2Vec2(0.0, 9.81), true)
        this.world.SetWarmStarting(true)
    
    buildWorld: =>
        wall = new b2PolygonShape()
        wallBody = new b2BodyDef()
        
        wall.SetAsBox((0.5 / @physicsScale), (600 / @physicsScale))
        # Left
        wallBody.position.Set((0 / @physicsScale), (0 / @physicsScale))
        @walls['left'] = @world.CreateBody(wallBody)
        @walls['left'].CreateFixture2(wall)
        # Right
        wallBody.position.Set((850 / @physicsScale), (0 / @physicsScale))
        @walls['right'] = @world.CreateBody(wallBody)
        @walls['right'].CreateFixture2(wall)
        
        wall.SetAsBox((850 / @physicsScale), (0.5 / @physicsScale))
        # Top
        # wallBody.position.Set((0 / @physicsScale), (0 / @physicsScale))
        # @walls['top'] = @world.CreateBody(wallBody)
        # @walls['top'].CreateFixture2(wall)
        # Bottom
        wallBody.position.Set((0 / @physicsScale), (600 / @physicsScale))
        @walls['bottom'] = @world.CreateBody(wallBody)
        @walls['bottom'].CreateFixture2(wall)
    
    add: (balls) =>
        for ball in balls
            this.addBall(ball.radius, ball.colour)
    
    addBall: (radius, colour) =>
        fixture = new b2FixtureDef()
        fixture.shape = new b2CircleShape(radius / @physicsScale);
        fixture.friction = 0.35;
        fixture.restitution = 0.2;
        fixture.density = 10.0;
        ballBody = new b2BodyDef()
        ballBody.type = b2Body.b2_dynamicBody
        x = (750 / 2) - radius/2
        ballBody.position.Set((x / @physicsScale), (-100 / @physicsScale) * (Math.random()))
        ball = @world.CreateBody(ballBody)
        ball.SetUserData({
            'colour':colour,
            'spawn_time':new Date().getTime()
        })
        ball.CreateFixture(fixture)
    
    update: =>
        this.fps()
        postMessage(JSON.stringify({
            'action':'update',
            'fps':@fpsActual,
            'ttl':@ballTTL
        }))
        setTimeout(( => @update() ), 1000)
    
    fps: =>
        @fpsActual = @frames
        @frames = 0
    
    checkTTL: =>
        if @fpsActual < 80 and @ballTTL > 5000
            delta = 100 * (80 - @fpsActual)
            if delta < @ballTTL
                @ballTTL -= delta
            else if delta < 0
                @ballTTL = 2500
        if @fpsActual > 80 and @ballTTL < @ballMaxTTL
            @ballTTL += 10 * (@fpsActual - 0)
        setTimeout(( => @checkTTL() ), 100)
    
    updateState: =>
        @state = []
        now = new Date().getTime()
        body = this.world.GetBodyList()
        while body != null
            user_data = body.GetUserData()
            if user_data and (now - user_data['spawn_time']) > @ballTTL
                @world.DestroyBody(body)
            else
                _body = {}
                _body.position = body.GetPosition()
                _body.angle = body.GetAngle()
                if user_data
                    _body.colour = user_data['colour']
                _body.bodytype = @bodyTypes[body.GetType()]
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
        @stateTimer = setTimeout(( => @updateState() ), 1000/100)
    
    loop: =>
        clearTimeout(@loopTimer)
        now = new Date().getTime()
        delta = (now - @lastUpdate) / 1000
        @lastUpdate = now
        
        if delta > 10
            delta = 1 / this.fpsTarget
        
        this.stepWorld(delta)
        @frames++
        @loopTimer = setTimeout(( => @loop() ))
    
    stepWorld: (delta) =>
        @world.ClearForces()
        @world.Step(delta, delta*@velocityIterationsPerSecond, delta*@positionIterationsPerSecond)


worker = null
onmessage = (event) ->
    message = JSON.parse(event.data)
    switch message.action
        when 'start'
            worker = new PhysicsWorker()
        when 'add'
            worker.add(message.balls)