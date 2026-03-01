import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { 
    gameState, getGameState, 
    CANVAS_WIDTH, CANVAS_HEIGHT, 
    ROTATION_SPEED, 
    logGameInfo, logPlayerInfo 
} from './globals.js';
import { setupInputHandling, getRotationInput } from './input.js';
import { Player, PlatformManager, CollectibleManager, ParticleSystem } from './entities.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupUI, renderUI } from './ui.js';

// ==========================================
// INITIALIZATION
// ==========================================
function init() {
    // 1. Setup Container
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.style.width = `${CANVAS_WIDTH}px`;
    gameContainer.style.height = `${CANVAS_HEIGHT}px`;
    gameContainer.style.position = 'relative';
    gameContainer.style.overflow = 'hidden';
    document.body.appendChild(gameContainer);
    gameState.gameContainer = gameContainer;

    // 2. Setup Three.js Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x111122);
    gameState.scene.fog = new THREE.Fog(0x111122, 20, 60);

    // 3. Setup Renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    gameContainer.appendChild(gameState.renderer.domElement);

    // 4. Setup Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    gameState.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    gameState.scene.add(dirLight);

    // 5. Setup Managers
    gameState.platformManager = new PlatformManager();
    gameState.collectibleManager = new CollectibleManager();
    gameState.particleSystem = new ParticleSystem();

    // 6. Setup Player
    gameState.player = new Player();

    // 7. Setup Camera
    setupCamera();

    // 8. Setup Inputs & UI
    setupInputHandling();
    setupUI();

    // 9. Start Loop
    gameState.time = performance.now();
    requestAnimationFrame(gameLoop);
    
    // Seed Randomness for reproducibility
    Math.seedrandom('42');
    
    // Log Start
    logGameInfo({ event: "init", status: "success" });
    
    // Setup AI Test Hook
    window.setControlMode = (mode) => {
        gameState.controlMode = mode;
        console.log("Control Mode set to:", mode);
    };
}

// ==========================================
// MAIN LOOP
// ==========================================
function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    // Delta Time Calculation
    const dt = Math.min((currentTime - gameState.time) / 1000, 0.1); // Cap at 0.1s
    gameState.time = currentTime;
    gameState.deltaTime = dt;
    gameState.frameCount++;

    if (gameState.gamePhase === "PLAYING") {
        updatePlaying(dt);
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        // Still update camera/particles for visual polish
        if (gameState.particleSystem) gameState.particleSystem.update(dt);
    }

    // Render
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

function updatePlaying(dt) {
    const player = gameState.player;
    
    // 1. Handle World Rotation (The "Twist" Mechanic)
    let rotationInput = 0;
    
    if (gameState.controlMode === "HUMAN") {
        rotationInput = getRotationInput();
    } else {
        // AI Logic for testing
        rotationInput = handleAI(dt);
    }
    
    // Apply rotation
    gameState.worldRotation += rotationInput * ROTATION_SPEED;
    
    // Rotate the entire scene content around Z axis?
    // Actually, physically rotating thousands of objects is slow.
    // Better: Rotate the camera orbit?
    // Or: Rotate the geometry container?
    // Implementation: We keep player X=0. We rotate the Platform container.
    // But entities.js adds platforms to scene directly.
    // Let's iterate platforms and rotate them?
    // No, better:
    // Create a pivot object in scene, attach all platforms/gems to it.
    // Rotate the pivot.
    
    if (!gameState.worldPivot) {
        gameState.worldPivot = new THREE.Group();
        gameState.scene.add(gameState.worldPivot);
        // We need to move existing items to pivot if we switch methods mid-stream
        // But for now, let's assume PlatformManager adds to scene.
        // Let's refactor PlatformManager slightly to add to pivot?
        // Or just iterate:
    }
    
    // Update Pivot Rotation
    // Note: PlatformManager spawns platforms at absolute positions based on current generation angle.
    // But the "World Rotation" is the player's view offset.
    // Visually, the Camera is fixed up. The World rotates.
    // We can simulate this by rotating the camera around 0,0,Z?
    // No, camera.js fixes camera position.
    // Let's rotate the SCENE ROOT (except player/camera).
    
    // Actually, simple solution:
    // Player is fixed at Top (Angle 0).
    // Platform `mesh.rotation.z` includes `worldRotation`.
    // Platform `mesh.position` is rotated by `worldRotation`.
    // This requires updating all platform transforms every frame.
    // Efficient enough for < 100 objects.
    
    // Update Platform Positions based on World Rotation
    updateWorldTransforms();

    // 2. Update Entities
    gameState.platformManager.update(player.mesh.position.z);
    gameState.collectibleManager.update(dt, player);
    gameState.particleSystem.update(dt);
    player.update(dt); // Physics checks happen here relative to logical rotation
    
    // 3. Update Camera
    updateCamera();
    
    // 4. Update Score
    gameState.distanceTraveled = player.mesh.position.z;
    gameState.score += speedFactor(dt);
    
    // 5. Increase Speed
    gameState.currentSpeed += 0.0001;
    
    // Logging
    if (gameState.frameCount % 10 === 0) {
        logPlayerInfo(player);
    }
}

function updateWorldTransforms() {
    // Rotate all world objects (platforms, gems) around Z axis to match gameState.worldRotation
    // The logical angle of a platform is p.angle.
    // The visual angle is p.angle + gameState.worldRotation.
    
    const r = gameState.worldRotation;
    
    // Platforms
    for (const p of gameState.platformManager.platforms) {
        const visualAngle = p.angle + r;
        
        // Update Position
        // x = rad * sin(visualAngle)
        // y = rad * cos(visualAngle)
        const rad = 5; // TUNNEL_RADIUS
        p.mesh.position.x = rad * Math.sin(visualAngle);
        p.mesh.position.y = rad * Math.cos(visualAngle);
        
        // Update Rotation (face center)
        p.mesh.rotation.z = -visualAngle;
    }
    
    // Gems
    for (const g of gameState.collectibleManager.gems) {
        const visualAngle = g.angle + r;
        const rad = g.radius;
        g.mesh.position.x = rad * Math.sin(visualAngle);
        g.mesh.position.y = rad * Math.cos(visualAngle);
        g.mesh.rotation.z = -visualAngle;
    }
}

function speedFactor(dt) {
    return dt * 10;
}

// ==========================================
// AI / TESTING
// ==========================================
function handleAI(dt) {
    // Simple AI to stay alive
    if (gameState.controlMode === "TEST_1") {
        // Just jump constantly
        gameState.player.jumpCooldown = 0; // cheat
        gameState.player.velocity.y = 0.1;
        return 0; // No rotation
    }
    
    if (gameState.controlMode === "TEST_2") {
        // Perfect Play
        // Look ahead for platforms
        const playerZ = gameState.player.mesh.position.z;
        const lookAhead = 5;
        
        // Find platform at z + lookAhead
        // We need to know the angle of the next platform relative to current world rotation
        // We want visualAngle to be 0 (top)
        
        // Find target platform
        let targetAngle = null;
        for (const p of gameState.platformManager.platforms) {
            if (p.zStart <= playerZ + lookAhead && p.zEnd >= playerZ + lookAhead) {
                targetAngle = p.angle;
                break;
            }
        }
        
        if (targetAngle !== null) {
            // Calculate error
            // current visual angle = targetAngle + worldRotation
            // we want visual angle = 0
            // so worldRotation should be -targetAngle
            
            const currentVisual = targetAngle + gameState.worldRotation;
            
            // Normalize
            let diff = currentVisual;
            while (diff <= -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            
            // Steer to minimize diff (bring it to 0)
            if (diff > 0.1) return -1; // Rotate left
            if (diff < -0.1) return 1; // Rotate right
            
            // Auto jump if gap coming?
            // Simplified for constraint: just steer.
        }
        
        // Jump logic
        const groundNow = gameState.platformManager.getGroundHeight(playerZ + 1, -gameState.worldRotation);
        if (groundNow === null && gameState.player.onGround) {
             // Gap ahead! Jump!
             // Trigger jump via key simulation or direct call
             gameState.player.velocity.y = 0.35;
             gameState.player.onGround = false;
        }
        
        return 0;
    }
    
    return 0;
}

// Start Game
init();