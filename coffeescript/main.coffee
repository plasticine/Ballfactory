class Engine
    constructor: ->
        this.drawables = []
        this.remotes = new Remotes(this)
        this.viewport = new Viewport(this)
        this.physics = new Worker('/static/scripts/physics.js')
        this.physics.onmessage = this.physicsMessage
        this.physics.onerror = this.physicsError
        this.physics.postMessage(JSON.stringify({
            'action':'start'
        }))
    
    physicsMessage: (event) =>
        message = JSON.parse(event.data)
        switch message.action
            when 'fps'
                $('.physics-fps span', '#debug').html("#{ message.fps }")
            when 'state'
                @drawables = message.state
                $('.objects span', '#debug').html("#{ @drawables.length }")
    
    physicsError: (event) ->
        console.log 'physicsError:', event


class Remotes
    constructor: (@parent) ->
        this.requests = 0
        this.hosts = []
        $.each JSON.parse($('#hosts').text()), (index, host) =>
            @open(host)
    
    open: (host) =>
        @hosts[host] = new WebSocket("ws://localhost:8888#{ host }")
        @hosts[host].onmessage = @onmessage
        @hosts[host].onclose = @onclose
        @hosts[host].onopen = @onopen
    
    close: =>
        $.each @hosts, (index, host) =>
            host.close()
    onmessage: (event) =>
        data = JSON.parse(event.data)
        this.requests++
        $('.requests span', '#debug').html("#{ this.requests }")
    
    onopen: =>
        # console.log 'onopen'
    
    onclose: =>
        # console.log 'onclose'


class Viewport
    constructor: (@parent) ->
        this.canvas = $('canvas#viewport')
        this.context = this.canvas[0].getContext("2d")
        this.viewportScale = 20
        this.width = 0
        this.height = 0
        this.loopTimer = false
        this.framerateTimer = false
        this.fpsActual = 0
        this.frames = 0
        this.lastUpdate = 0
        this.fps()
        this.loop()
    
    loop: =>
        now = new Date().getTime()
        delta = (now - @lastUpdate) / 1000
        @lastUpdate = now
        this.stepViewport()
        @frames++
        @loopTimer = setTimeout(( => @loop() ), 1000/32)
    
    scale: (qty) ->
        qty * @viewportScale
    
    stepViewport: =>
        @context.clearRect(0, 0, @canvas.width(), @canvas.height())
        for drawable in @parent.drawables
            @context.beginPath()
            switch drawable.shape.type
                when 'polygon'
                    width = (Math.abs(drawable.shape.vertices[0].x) + Math.abs(drawable.shape.vertices[1].x)) * @viewportScale
                    height = (Math.abs(drawable.shape.vertices[1].y) + Math.abs(drawable.shape.vertices[2].y)) * @viewportScale
                    @context.fillRect(drawable.position.x * @viewportScale, drawable.position.y * @viewportScale, width, height)
                    
                when 'circle'
                    @context.arc(
                        this.scale(drawable.position.x),
                        this.scale(drawable.position.y),
                        this.scale(drawable.shape.radius),
                        0,
                        Math.PI*2,
                        false
                    )
            @context.fill()
    
    fps: =>
        @fpsActual = @frames
        @frames = 0
        $('.viewport-fps span', '#debug').html("#{ @fpsActual }")
        @framerateTimer = setTimeout(( => @fps() ), 1000)


jQuery ->
    window.engine = new Engine()