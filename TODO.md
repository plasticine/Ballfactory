Ballfactory

Structure should be something like;

    Engine:
        - main script that handle websocket connections and handling new events from the sockets
    
    Viewport:
        - viewport handles drawing of the UI in WebGL.
    
    Physics:
        - runs the physics simulation in a worker process and passes back json object representing state
        - new objects can be added via passing of messages into the worker


Will work something like this;
    1. Engine will create socket connections and start listening
    2. Engine will init the viewport which will start up a drawing loop.
    3. Engine will start up the physics worker which will kick off physics simulation loop
    4. When engine recieves objects over socket it will pass them to the physics worker, who will slot them into the simulation loop
    5. Each simulation loop the physics worker will pass back a JSON object representing the current state to the Engine.
    6. Each draw loop of the Viewport the viewport will fetch the current state from the engine and update the viewport.


This should mean that the Engine is a broker between the Physics simulation, running in one process and the Viewport rendering the current UI
