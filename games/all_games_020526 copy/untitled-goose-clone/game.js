import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, ZONES } from './globals.js';
import { setupLighting } from './lighting.js';
import { setupCamera, updateCamera } from './camera.js';
import { Goose, Gardener, Item, StaticProp } from './entities.js';
import { initTasks, checkTasks } from './task_system.js';
import { initUI, renderUI } from './ui.js';

// Setup Main System
function init() {
    // 1. Container
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.width = `${CANVAS_WIDTH}px`;
    container.style.height = `${CANVAS_HEIGHT}px`;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    gameState.gameContainer = container;

    // 2. Renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(gameState.renderer.domElement);

    // 3. Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x87CEEB); // Sky Blue
    
    // 4. Lights & Camera
    setupLighting();
    setupCamera();
    
    // 5. Input
    setupInput();
    
    // 6. UI
    initUI();
    
    // 7. Start Loop
    gameState.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    // Initial Logs
    gameState.logs.game_info.push({ status: "initialized", timestamp: Date.now() });
}

function setupGameWorld() {
    // Clear old
    while(gameState.scene.children.length > 0){ 
        gameState.scene.remove(gameState.scene.children[0]); 
    }
    // Re-add lights
    setupLighting();
    
    // Reset State
    gameState.entities = [];
    gameState.staticProps = [];
    gameState.score = 0;
    
    // Ground
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x7CFC00 }); // Grass Green
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    gameState.scene.add(ground);
    
    // Lake
    const lakeGeo = new THREE.CircleGeometry(ZONES.LAKE.radius, 32);
    const lakeMat = new THREE.MeshStandardMaterial({ color: 0x00BFFF });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(ZONES.LAKE.x, 0.01, ZONES.LAKE.z); // Slightly above ground
    lake.receiveShadow = true;
    gameState.scene.add(lake);
    
    // Picnic Blanket
    const blanketGeo = new THREE.PlaneGeometry(3, 3);
    const blanketMat = new THREE.MeshStandardMaterial({ color: 0xFF0000 }); // Red Blanket
    const blanket = new THREE.Mesh(blanketGeo, blanketMat);
    blanket.rotation.x = -Math.PI / 2;
    blanket.position.set(ZONES.PICNIC.x, 0.01, ZONES.PICNIC.z);
    blanket.receiveShadow = true;
    gameState.scene.add(blanket);

    // Entities
    gameState.player = new Goose(0, 0);
    gameState.gardener = new Gardener(5, 5);
    gameState.entities.push(gameState.player, gameState.gardener);
    
    // Items
    createItem('Rake', 8, 8, 0x808080, 'long');
    createItem('Radio', 10, -5, 0x333333, 'box');
    createItem('Apple', -2, 4, 0xFF0000, 'sphere');
    createItem('Sandwich', 5, 8, 0xF5DEB3, 'box'); // Wheat color
    createItem('Thermos', 3, 3, 0x0000FF, 'box');
    
    // Props (Environment)
    // Fences
    for(let i=-20; i<=20; i+=2) {
        if (Math.abs(i) > 4) { // Gap for gate
            new StaticProp(i, -20, 'fence');
            new StaticProp(i, 20, 'fence');
            new StaticProp(-20, i, 'fence');
            new StaticProp(20, i, 'fence');
        }
    }
    
    // Trees
    new StaticProp(-15, -15, 'tree');
    new StaticProp(15, -15, 'tree');
    new StaticProp(-15, 15, 'tree');
    
    // Init Tasks
    initTasks();
    
    // Removed Test Modes setup
}

function createItem(name, x, z, color, type) {
    const item = new Item(name, x, z, color, type);
    gameState.entities.push(item);
}

function setupInput() {
    window.addEventListener('keydown', e => {
        if (gameState.keys.hasOwnProperty(e.key) || gameState.keys.hasOwnProperty(e.code)) {
            gameState.keys[e.key] = true;
            gameState.logs.inputs.push({ type: 'keydown', key: e.key, frame: gameState.frameCount });
            
            // Phase Controls
            if (e.key === 'Enter' && gameState.gamePhase === 'START') {
                setupGameWorld();
                gameState.gamePhase = 'PLAYING';
            }
            if (e.key === 'Escape') {
                gameState.gamePhase = gameState.gamePhase === 'PLAYING' ? 'PAUSED' : 'PLAYING';
            }
            if (e.key.toLowerCase() === 'x' && (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED')) {
                gameState.showTodoList = !gameState.showTodoList;
            }
            if (e.key.toLowerCase() === 'r' && (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE')) {
                gameState.gamePhase = 'START';
            }
        }
    });
    
    window.addEventListener('keyup', e => {
        if (gameState.keys.hasOwnProperty(e.key)) {
            gameState.keys[e.key] = false;
        }
    });
    
    // Control Mode Override (kept for potential programmatic use, though no UI button calls it now)
    window.setControlMode = (mode) => {
        gameState.controlMode = mode;
        console.log("Control Mode set to:", mode);
        // Reset if needed
        gameState.gamePhase = "START";
    };
}

function gameLoop(time) {
    const dt = Math.min((time - gameState.lastTime) / 1000, 0.1);
    gameState.lastTime = time;
    gameState.frameCount++;
    gameState.deltaTime = dt;

    if (gameState.gamePhase === 'PLAYING') {
        // Update all entities
        for (const entity of gameState.entities) {
            entity.update(dt);
        }
        
        checkTasks();
        updateCamera();
    }

    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();

    requestAnimationFrame(gameLoop);
}

// Start
init();