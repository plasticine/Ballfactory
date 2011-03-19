

class Ballfactory
    constructor: ->
        this.canvas = $('#canvas')
        this.balls = []
        this.draw = new Draw(this)
        this.world = new World(this)
        
        this.createSockets()
        
        self = this
        this.debugView = new DebugView(this)
        
        this.colours = ['#F9E4AD', '#E6B098', '#CC4452', '#723147', '#31152B']
        
        this.loop = window.setInterval(( ->
            self.draw.update()
        ), 1000/40)
    
    rand: (from, to) ->
        Math.floor(Math.random() * (to - from + 1) + from)
    
    newBall_left: =>
        x = 0
        radius = this.rand(3, 10) * 0.1
        ball = new Ball(this, radius, x, 1, [10, 0], {'colour':this.colours[this.rand(0, 4)]})
        this.balls.push(ball)
    
    newBall_right: =>
        x = 29
        radius = this.rand(3, 10) * 0.1
        ball = new Ball(this, radius, x, 1, [-10, 0], {'colour':this.colours[this.rand(0, 4)]})
        this.balls.push(ball)
    
    createSockets: =>
        self = this
        jQuery.each jQuery.parseJSON($('#hosts').text()), (index, host) ->
            self.socket = new Socket(self, "#{ host }")


class Socket
    constructor: (@parent, @host) ->
        self = this
        this.requests = 0
        this.host = @host
        this.parent = @parent
        this.socket = new WebSocket("ws://localhost:8888#{ @host }")
        this.socket.onopen = ->
            this.send('{"connection":true,"connection_type":"client"}')
        this.socket.onmessage = (event) ->
            self.handleData(event.data)
        this.socket.onclose = ->
            console.log 'onclose'
        this.socket.onopen = ->
            console.log 'onopen'
    
    send: (message) =>
        message = jQuery.parseJSON(message)
        this.socket.send(message)
    
    close: =>
        this.socket.close()
    
    handleData: (data) =>
        this.requests += 1
        $('#debug .requests').html("#{ this.requests } requests")
        data = jQuery.parseJSON(data)
        console.log data
        this.parent.newBall_left()


class World
    constructor: (@parent) ->
        this.create()
    
    add: (object) ->
        
    
    create: ->
        this.gravity = new Box2D.Common.Math.b2Vec2(0, 10)
        this.world = new Box2D.Dynamics.b2World(this.gravity, true)
        
        fixDef = new Box2D.Dynamics.b2FixtureDef
        bodyDef = new Box2D.Dynamics.b2BodyDef
        bodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody
        fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape
        fixDef.shape.SetAsBox(30, 0.033)
        
        # bottom
        bodyDef.position.Set(0, 25);
        this.world.CreateBody(bodyDef).CreateFixture(fixDef)
        # top
        bodyDef.position.Set(0, 0)
        this.world.CreateBody(bodyDef).CreateFixture(fixDef)
        # left
        fixDef.shape.SetAsBox(0.033, 30)
        bodyDef.position.Set(0, 13)
        this.world.CreateBody(bodyDef).CreateFixture(fixDef)
        # right
        bodyDef.position.Set(30, 0)
        this.world.CreateBody(bodyDef).CreateFixture(fixDef)


class Draw
    constructor: (@parent) ->
        this.lastTime = new Date()
        this.timeStep = 1/30
        this.frameCount = 0
        this.fps = 0
        this.context = @parent.canvas[0].getContext("2d")
    
    updateFps: ->
        now = new Date();
        if Math.ceil((now.getTime() - this.lastTime.getTime())) >= 1000
            this.fps = this.frameCount
            this.frameCount = 0.0
            this.lastTime = now
        this.frameCount++
        $('#debug .fps').html("#{ this.fps } fps")
    
    update: ->
        console.log 'Draw.update()'
        this.updateFps()
        @parent.world.world.Step(this.timeStep, 10, 10)
        # @parent.world.world.DrawDebugData()
        @parent.world.world.ClearForces()
        # this.context.canvas.width  = window.innerWidth
        # this.context.canvas.height = window.innerHeight
        this.drawWorld(@parent.world.world, this.context)
    
    drawWorld: (world, context) ->
        context.clearRect(0, 0, context.canvas.width, context.canvas.height)
        `for (var body = world.m_bodyList; body; body = body.m_next) {
            for (var fixture = body.m_fixtureList; fixture != null; fixture = fixture.m_next) {
                this.drawShape(fixture, context);
            }
        }`
        false
    
    drawShape: (fixture, context) ->
        if fixture.m_shape.m_radius
            userData = fixture.m_body.GetUserData()
            position = fixture.m_body.GetPosition()
            radius = fixture.m_shape.m_radius * 30
            context.beginPath()
            if userData and userData['colour']
                context.fillStyle = userData['colour']
            context.arc(position.x * 30, position.y * 30, radius, 0, Math.PI*2, false)
            context.fill()
            context.moveTo(position.x * 30, position.y * 30)


class Ball
    constructor: (@parent, @radius, @x, @y, @velocity, @userdata) ->
        self = this
        this.create()
        window.setInterval(( ->
            self.destroy()
        ), 15000)
    
    destroy: ->
        @parent.world.world.DestroyBody(this.body.m_body)
    
    create: ->
        fixDef = new Box2D.Dynamics.b2FixtureDef()
        fixDef.density = 1.0
        fixDef.friction = 0.20
        fixDef.restitution = 0.4
        bodyDef = new Box2D.Dynamics.b2BodyDef()
        bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody
        fixDef.shape = new Box2D.Collision.Shapes.b2CircleShape(@radius)
        bodyDef.position.x = @x
        bodyDef.position.y = @y
        bodyDef.linearVelocity = new Box2D.Common.Math.b2Vec2(@velocity[0], @velocity[1])
        bodyDef.userData = @userdata
        this.body = @parent.world.world.CreateBody(bodyDef).CreateFixture(fixDef)


class DebugView
    constructor: (@parent) ->
        console.log 'DebugView.constructor()'
        this.debugDraw = new Box2D.Dynamics.b2DebugDraw()
        this.debugDraw.SetSprite(@parent.canvas[0].getContext("2d"))
        this.debugDraw.SetDrawScale(30.0)
        this.debugDraw.SetFillAlpha(0.5)
        this.debugDraw.SetLineThickness(5.0)
        this.debugDraw.SetFlags(Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit)
        @parent.world.world.SetDebugDraw(this.debugDraw)


$ ->
    surface = new Ballfactory()
