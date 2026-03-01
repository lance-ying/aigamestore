import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_LENGTH, WORLD_WIDTH, logGameInfo } from './globals.js';
import { setupInput, updateInput } from './input.js';
import { createGridTexture, randomRange } from './utils.js';
import { Player, Obstacle, Collectible } from './entities.js';
import { updatePhysics } from './physics.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupUI, renderUI } from './ui.js';

// Setup Three.js
function initRenderer() {
    // Create Container
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = `${CANVAS_WIDTH}px`;
    container.style.height = `${CANVAS_HEIGHT}px`;
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    gameState.gameContainer = container;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    gameState.renderer = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 20, 60);
    gameState.scene = scene;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, -5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    // Floor
    const gridTex = createGridTexture();
    gridTex.wrapS = THREE.RepeatWrapping;
    gridTex.wrapT = THREE.RepeatWrapping;
    gridTex.repeat.set(10, 200); // Repeat along track

    const floorGeo = new THREE.PlaneGeometry(WORLD_WIDTH, LEVEL_LENGTH + 100);
    const floorMat = new THREE.MeshStandardMaterial({ 
        map: gridTex, 
        color: 0x888888,
        roughness: 0.8 
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = LEVEL_LENGTH / 2; // Center it
    floor.receiveShadow = true;
    scene.add(floor);
    gameState.floor = floor;

    setupCamera();
    setupUI();
    setupInput();
}

function generateLevel() {
    // Seed random
    Math.seedrandom('jelly_shift_v1');

    // Clear old objects
    if (gameState.obstacles.length > 0) {
        gameState.obstacles.forEach(o => gameState.scene.remove(o.mesh));
        gameState.obstacles = [];
    }
    if (gameState.collectibles.length > 0) {
        gameState.collectibles.forEach(c => gameState.scene.remove(c.mesh));
        gameState.collectibles = [];
    }

    // Generate Obstacles
    let z = 30; // Start offset
    const types = ['GATE_NARROW', 'BARRIER_LOW', 'SQUARE_HOLE'];
    
    while (z < LEVEL_LENGTH - 20) {
        // Space out obstacles
        const gap = randomRange(25, 40);
        z += gap;
        
        const type = types[Math.floor(randomRange(0, types.length))];
        const obs = new Obstacle(z, type);
        gameState.obstacles.push(obs);

        // Add Collectibles in between
        const numCols = Math.floor(randomRange(1, 4));
        for(let i=0; i<numCols; i++) {
            const cz = z - (gap/2) + (i*3);
            const cx = randomRange(-4, 4);
            const cy = 1;
            gameState.collectibles.push(new Collectible(cx, cy, cz));
        }
    }

    // Add finish line visual
    const finishGeo = new THREE.BoxGeometry(WORLD_WIDTH, 10, 1);
    const finishMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 });
    const finish = new THREE.Mesh(finishGeo, finishMat);
    finish.position.set(0, 5, LEVEL_LENGTH);
    gameState.scene.add(finish);
    gameState.entities.push({ mesh: finish }); // Store to clean up if needed
}

function resetGame() {
    // Reset State
    gameState.score = 0;
    gameState.frameCount = 0;
    gameState.requestReset = false;
    
    // Cleanup Entities
    if (gameState.player) {
        gameState.scene.remove(gameState.player.mesh);
    }
    
    // Regenerate
    generateLevel();
    
    // New Player
    gameState.player = new Player();
    
    // Reset Camera
    gameState.camera.position.set(0, 5, -10);
    
    gameState.gamePhase = "START";
}

function update(time) {
    requestAnimationFrame(update);

    const now = performance.now();
    const dt = Math.min((now - gameState.elapsedTime) / 1000, 0.1); // Cap dt
    gameState.elapsedTime = now;
    gameState.deltaTime = dt;
    gameState.frameCount++;

    if (gameState.requestReset) {
        resetGame();
    }

    // Logic
    if (gameState.gamePhase === "PLAYING") {
        updateInput();
        
        if (gameState.player) {
            gameState.player.update(dt);
            
            // Win Condition
            if (gameState.player.position.z >= LEVEL_LENGTH) {
                gameState.gamePhase = "GAME_OVER_WIN";
                logGameInfo({ event: "win", score: gameState.score });
            }
        }
        
        gameState.collectibles.forEach(c => c.update(dt));
        updatePhysics(dt);
        updateCamera(dt);
    }
    
    // Always render
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Start
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Auto start if test
    if (mode.startsWith("TEST") && gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
    }
};

initRenderer();
resetGame(); // Initial setup
gameState.elapsedTime = performance.now();
update();

// Log initial
logGameInfo({ event: "init" });