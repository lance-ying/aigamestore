import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_SIZE, getGameState } from './globals.js';
import { setSeed } from './utils.js';
import { initMaterials } from './textures.js';
import { World } from './world.js';
import { Player, Enemy } from './entities.js';
import { initInput, getInputState } from './input.js';
import { initUI, renderUI } from './ui.js';

// Setup basic environment
function init() {
    // Container
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.width = `${CANVAS_WIDTH}px`;
    container.style.height = `${CANVAS_HEIGHT}px`;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    gameState.gameContainer = container;

    // Renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: false });
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(gameState.renderer.domElement);

    // Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x87CEEB);
    gameState.scene.fog = new THREE.Fog(0x87CEEB, 10, 40);

    // Camera
    gameState.camera = new THREE.PerspectiveCamera(70, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 1000);
    
    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    gameState.scene.add(ambient);
    gameState.ambientLight = ambient;

    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    gameState.scene.add(sun);
    gameState.sunLight = sun;

    // Assets
    initMaterials();

    // Init systems
    initInput();
    initUI();
    
    // Seed
    setSeed(42);
    
    // Setup World
    gameState.world = new World();
    
    // Setup Player
    gameState.player = new Player(WORLD_SIZE/2, 10, WORLD_SIZE/2);
    gameState.entities.push(gameState.player);

    // Initial enemies
    spawnEnemies();

    // Start loop
    gameState.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    // Initial log
    window.logs.game_info.push({ status: "INIT", time: Date.now() });
}

function spawnEnemies() {
    for(let i=0; i<3; i++) {
        const x = Math.random() * WORLD_SIZE;
        const z = Math.random() * WORLD_SIZE;
        const e = new Enemy(x, 20, z); // Spawn high, let fall
        gameState.entities.push(e);
        gameState.scene.add(e.mesh);
    }
}

function updateGame(deltaTime) {
    // Cap delta
    if (deltaTime > 0.1) deltaTime = 0.1;

    // Update Player Input
    const input = getInputState();
    
    if (gameState.controlMode !== "HUMAN") {
        // Automation for testing
        handleAutomatedControl(input);
    }
    
    gameState.player.move(input.forward, input.right, deltaTime);
    gameState.player.rotate(input.rotY, input.rotX);
    if (input.jump) gameState.player.jump();

    // Update Entities
    gameState.entities.forEach(ent => ent.update(deltaTime));

    // Simple Day/Night
    gameState.dayTime += deltaTime * 0.01;
    const angle = gameState.dayTime;
    gameState.sunLight.position.x = Math.sin(angle) * 100;
    gameState.sunLight.position.y = Math.cos(angle) * 100;
    gameState.sunLight.intensity = Math.max(0, Math.cos(angle));
    
    const skyDarkness = Math.max(0.1, Math.cos(angle));
    gameState.scene.background.setHSL(0.6, 0.5, skyDarkness * 0.5 + 0.1);
    
    // Log player
    if (gameState.frameCount % 60 === 0) {
        window.logs.player_info.push({
            pos: gameState.player.mesh.position.clone(),
            hp: gameState.player.health,
            frame: gameState.frameCount
        });
    }
}

function handleAutomatedControl(input) {
    // Override input for tests
    if (gameState.controlMode === "TEST_1") {
        input.forward = 1; // Move forward
    } else if (gameState.controlMode === "TEST_2") {
        // Just verify gravity really
    }
}

function gameLoop(time) {
    const dt = (time - gameState.lastTime) / 1000;
    gameState.lastTime = time;
    gameState.deltaTime = dt;
    gameState.frameCount++;

    if (gameState.gamePhase === "PLAYING") {
        updateGame(dt);
    }
    
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
    
    requestAnimationFrame(gameLoop);
}

// Global control mode setter
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart logic if needed
    if (mode.startsWith("TEST")) {
        // Reset player for consistent testing
        gameState.player.mesh.position.set(WORLD_SIZE/2, 20, WORLD_SIZE/2);
        gameState.player.velocity.set(0,0,0);
        gameState.gamePhase = "PLAYING";
    }
};

init();