class Engine
    constructor: ->
        this.drawables = []
        this.remotes = new Remotes(this)
        # this.viewport = new CanvasViewport(this)
        this.viewport = new WebGLViewport(this)
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
        this.viewportScale = 20
        this.fpsTarget = 1000/50
        this.width = 0
        this.height = 0
        this.loopTimer = false
        this.framerateTimer = false
        this.fpsActual = 0
        this.frames = 0
        this.lastUpdate = 0
        this.fps()
    
    loop: =>
        now = new Date().getTime()
        delta = (now - @lastUpdate) / 1000
        @lastUpdate = now
        this.draw()
        @frames++
        @loopTimer = setTimeout(( => @loop() ), @fpsTarget)
    
    scale: (qty) =>
        qty * @viewportScale
    
    fps: =>
        @fpsActual = @frames
        @frames = 0
        $('.viewport-fps span', '#debug').html("#{ @fpsActual }")
        @framerateTimer = setTimeout(( => @fps() ), 1000)


class CanvasViewport extends Viewport
    constructor: (@parent) ->
        super(@parent)
        this.context = this.canvas[0].getContext("2d")
        this.loop()
    
    draw: =>
        @context.clearRect(0, 0, @canvas.width(), @canvas.height())
        for drawable in @parent.drawables
            @context.beginPath()
            switch drawable.shape.type
                when 'polygon'
                    width = (Math.abs(drawable.shape.vertices[0].x) + Math.abs(drawable.shape.vertices[1].x))
                    height = (Math.abs(drawable.shape.vertices[1].y) + Math.abs(drawable.shape.vertices[2].y))
                    @context.fillRect(
                        this.scale(drawable.position.x),
                        this.scale(drawable.position.y),
                        this.scale(width),
                        this.scale(height)
                    )
                when 'circle'
                    @context.arc(
                        this.scale(drawable.position.x),
                        this.scale(drawable.position.y),
                        this.scale(drawable.shape.radius),
                        0,
                        Math.PI*2,
                        false
                    )
            @context.stroke()


class WebGLViewport extends Viewport
    constructor: (@parent) ->
        super(@parent)
        this.gl = WebGLUtils.create3DContext(@canvas[0], null)
        this.mvMatrix = mat3.create()
        this.pMatrix = mat3.create()
        this.circleDetail = 16
        this.circleEdges = 32
        this.circleShapeVbo = this.createCircleShapeVbo()
        this.boxShapeVbo = this.createBoxShapeVbo()
        this.initShaders()
        this.initDraw()
        this.reshapeViewport()
        this.loop()
    
    createStaticShapeVbo: (vertices, itemSize, numItems) =>
        vbo = @gl.createBuffer()
        @gl.bindBuffer(@gl.ARRAY_BUFFER, vbo)
        @gl.bufferData(@gl.ARRAY_BUFFER, new Float32Array(vertices), @gl.STATIC_DRAW)
        return {
            numItems: numItems,
            bind: (vertexPositionAttribute) =>
                @gl.bindBuffer(@gl.ARRAY_BUFFER, vbo)
                @gl.vertexAttribPointer(vertexPositionAttribute, itemSize, @gl.FLOAT, false, 0, 0)
        }
    
    createBoxShapeVbo: =>
        vertices = [-1.0, -1.0, -1.0,  1.0, 1.0,  1.0, 1.0, -1.0, -1.0, -1.0]
        vbo = this.createStaticShapeVbo(vertices, 2, 5)
        return {
            bind: vbo.bind
            fill: =>
                @gl.drawArrays(@gl.TRIANGLE_FAN, 0, 4)
            stroke: =>
                @gl.drawArrays(@gl.LINE_STRIP, 0, 5)
        }
    
    createCircleShapeVbo: =>
        vertices = [0.0, 0.0]
        step = 2.0 * Math.PI / @circleEdges
        for i in [0...@circleEdges]
            angle = step * i
            vertices[i*2 + 2] = Math.cos(angle)
            vertices[i*2 + 3] = Math.sin(angle)
        vertices[@circleEdges*2 + 2] = vertices[2]
        vertices[@circleEdges*2 + 3] = vertices[3]
        vbo = this.createStaticShapeVbo(vertices, 2, @circleEdges+2)
        return {
            bind: vbo.bind
            fill: =>
                 @gl.drawArrays(@gl.TRIANGLE_FAN, 0, @circleEdges+2)
            stroke: =>
                @gl.drawArrays(@gl.LINE_STRIP, 1, @circleEdges+1)
            destroy: =>
                try
                    @gl.deleteBuffer(vbo)
                catch error
                    # get a TypeError here in Chrome, hopefully the buffer will be destroyed by garbage collection
                    console.log error
        }
    
    setPMatrixUniform: =>
        @gl.uniformMatrix3fv(@shaderProgram.pMatrixUniform, false, @pMatrix)
        
    setMVMatrixUniform: =>
        @gl.uniformMatrix3fv(@shaderProgram.mvMatrixUniform, false, @mvMatrix)
    
    initShaders: =>
        vertex_shader_src = [
            'attribute vec3 aVertexPosition;',
            'uniform mat3 uMVMatrix;',
            'uniform mat3 uPMatrix;',
            'void main(void) {',
            '    vec2 vPos = vec2(aVertexPosition);',
            '    vec3 pos = uPMatrix * uMVMatrix * vec3(vPos, 1.0);',
            '    gl_Position = vec4(pos, 1.0);',
            '}',
        ].join('\n')
        fragment_shader_src = [
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'uniform vec4 uColor;',
            'void main(void) {',
            '    gl_FragColor = uColor;',
            '}',
        ].join('\n')
        vertexShader = this.createShader(vertex_shader_src, @gl.VERTEX_SHADER)
        fragmentShader = this.createShader(fragment_shader_src, @gl.FRAGMENT_SHADER)
        @shaderProgram = @gl.createProgram()
        @gl.attachShader(@shaderProgram, vertexShader)
        @gl.attachShader(@shaderProgram, fragmentShader)
        @gl.linkProgram(@shaderProgram)
        @gl.useProgram(@shaderProgram)
        @shaderProgram.vertexPositionAttribute = @gl.getAttribLocation(@shaderProgram, "aVertexPosition")
        @gl.enableVertexAttribArray(@shaderProgram.vertexPositionAttribute)
        @shaderProgram.pMatrixUniform = @gl.getUniformLocation(@shaderProgram, "uPMatrix");
        @shaderProgram.mvMatrixUniform = @gl.getUniformLocation(@shaderProgram, "uMVMatrix");
        @shaderProgram.glColorUniform = @gl.getUniformLocation(@shaderProgram, "uColor");
    
    createShader: (src, type) =>
        shader = @gl.createShader(type)
        @gl.shaderSource(shader, src)
        @gl.compileShader(shader)
        return shader
    
    initDraw: =>
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0)
    
    reshapeViewport: =>
        width = @canvas.width()
        height = @canvas.height()
        @gl.viewport(0, 0, width, height)
        mat3.ortho2D(@pMatrix, width, 0, height, 0)
        this.setPMatrixUniform()
    
    setColour: (r, g, b) =>
        @gl.uniform4f(@shaderProgram.glColorUniform, r, g, b, 1.0)
    
    drawBox: (x, y, width, height, angle, colour) =>
        mat3.identity(@mvMatrix)
        mat3.translate(@mvMatrix, this.scale(x), this.scale(y))
        mat3.rotate(@mvMatrix, angle)
        mat3.scale(@mvMatrix, this.scale(width), this.scale(height));
        this.setMVMatrixUniform()
        @boxShapeVbo.bind()
        this.setColour(0.0, 0.0, 0.0)
        @boxShapeVbo.fill()
    
    drawCircle: (x, y, radius, colour) =>
        mat3.identity(@mvMatrix)
        mat3.translate(@mvMatrix, this.scale(x), this.scale(y))
        mat3.scale(@mvMatrix, this.scale(radius), this.scale(radius))
        this.setMVMatrixUniform()
        @circleShapeVbo.bind()
        this.setColour(0.0, 0.0, 0.0)
        @circleShapeVbo.stroke()
    
    draw: =>
        @gl.clear(@gl.COLOR_BUFFER_BIT)
        for drawable in @parent.drawables
            switch drawable.shape.type
                when 'polygon'
                    width = (Math.abs(drawable.shape.vertices[0].x) + Math.abs(drawable.shape.vertices[1].x))
                    height = (Math.abs(drawable.shape.vertices[1].y) + Math.abs(drawable.shape.vertices[2].y))
                    this.drawBox(
                        drawable.position.x,
                        drawable.position.y,
                        width,
                        height,
                        drawable.angle,
                        [0, 0, 0]
                    )
                when 'circle'
                    this.drawCircle(
                        drawable.position.x,
                        drawable.position.y,
                        drawable.shape.radius,
                        [0, 0, 0]
                    )


jQuery ->
    window.engine = new Engine()