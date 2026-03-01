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
    let rotationInput = getRotationInput();
    
    // Apply rotation
    gameState.worldRotation += rotationInput * ROTATION_SPEED;
    
    if (!gameState.worldPivot) {
        gameState.worldPivot = new THREE.Group();
        gameState.scene.add(gameState.worldPivot);
    }
    
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
    gameState.currentSpeed += 0.00002; // Reduced acceleration
    
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

// Start Game
init();