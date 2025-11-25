<code_instructions>
- Organize code into modules with ES6 imports/exports; no dynamic imports.
- Expose `window.getGameState = () => gameState`.
- Implement `gameState` with keys: player, entities, score, gamePhase, controlMode, ...
- Use p5 instance mode, expose `window.gameInstance`.
- If `p5play` enabled: you may use p5.play v3 APIs for sprites and collisions.
- If `planck` enabled: you may use Planck.js for physics bodies and contacts.
- If `matter.js` enabled: you may use Matter.js v0.17.1 for 2D rigid body physics simulation.
  - Use Matter.Engine.create() to create a physics engine
  - Use Matter.World to manage physics bodies
  - Use Matter.Bodies for creating physics objects (rectangle, circle, polygon, etc.)
  - Use Matter.Body for manipulating bodies (position, velocity, force, etc.)
  - Run Matter.Engine.update(engine) in your game loop to step physics simulation
  - Render physics bodies using p5.js drawing functions by reading body.position and body.angle
  - Use Matter.Events.on() for collision detection callbacks
  - Common pattern: create physics in setup(), update in fixedUpdate(), render in draw()
- If `three.js` enabled: you may use three.js v0.160.0 for 3D graphics and rendering.
  - Use THREE.Scene to create a 3D scene
  - Use THREE.PerspectiveCamera or THREE.OrthographicCamera for viewing
  - Use THREE.WebGLRenderer to render the scene
  - Create geometries: BoxGeometry, SphereGeometry, CylinderGeometry, ConeGeometry, TorusGeometry, PlaneGeometry
  - Use materials: MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial, MeshPhysicalMaterial
  - Add lighting: AmbientLight, DirectionalLight, PointLight, SpotLight, HemisphereLight
  - Implement 3D physics manually: gravity, velocity, acceleration, collision detection (AABB, bounding sphere, raycasting)
  - Use THREE.Vector3 for 3D positions and movements
  - Update camera position and rotation each frame for smooth following
  - Use requestAnimationFrame for game loop
  - Common pattern: create scene/camera/renderer in init(), update entities in gameLoop(), render in gameLoop()
</code_instructions>

