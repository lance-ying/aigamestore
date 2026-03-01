/**
 * Main Game Entry Point and Loop
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_BG, WIN_DISTANCE, logGameInfo } from './globals.js';
import { initRandom } from './utils.js';
import { Player } from './entities.js';
import { initLevel, updateLevelGeneration } from './level.js';
import { updatePhysics } from './physics.js';
import { setupInput, restartGame } from './input.js';
import { setupUI, renderUI } from './ui.js';
import { setupCamera, updateCamera } from './camera.js';

// Setup basic three.js scene
function setupScene() {
    const container = document.getElementById('game-container') || document.body;
    
    // Create container if not exists for strict sizing
    if (container === document.body) {
        const div = document.createElement('div');
        div.id = 'game-container';
        div.style.width = `${CANVAS_WIDTH}px`;
        div.style.height = `${CANVAS_HEIGHT}px`;
        div.style.position = 'relative';
        div.style.overflow = 'hidden';
        document.body.appendChild(div);
        gameState.gameContainer = div;
    } else {
        gameState.gameContainer = container;
    }

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    gameState.gameContainer.appendChild(renderer.domElement);
    gameState.renderer = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLOR_BG);
    scene.fog = new THREE.FogExp2(COLOR_BG, 0.02);
    gameState.scene = scene;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    scene.add(dirLight);
}

// Initialization
function init() {
    initRandom(42);
    setupScene();
    setupCamera();
    setupUI();
    setupInput();

    // Create Player
    gameState.player = new Player();
    gameState.entities.push(gameState.player);
    gameState.scene.add(gameState.player.mesh);

    // Initial Level
    initLevel();
    
    // Listen for restart
    window.addEventListener("game-restart", () => {
        initLevel();
    });
    
    logGameInfo("Game Initialized");
    
    // Start Loop
    requestAnimationFrame(gameLoop);
}

let lastTime = performance.now();

function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt
    lastTime = time;
    
    gameState.deltaTime = dt;
    gameState.frameCount++;

    update(dt);
    render();
    
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (gameState.gamePhase === "PLAYING") {
        // Update Player
        if (gameState.player) {
            gameState.player.update(dt);
            
            // Win condition check
            if (gameState.player.position.z >= WIN_DISTANCE) {
                gameState.gamePhase = "GAME_OVER_WIN";
                logGameInfo("Level Complete", { score: gameState.score });
            }
        }
        
        // Update Physics
        updatePhysics(dt);
        
        // Update Entities
        gameState.collectibles.forEach(e => e.update(dt));
        gameState.particles.forEach(e => e.update(dt));
        gameState.tiles.forEach(e => e.update(dt));
        
        // Level Gen
        updateLevelGeneration();
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        // Auto-restart logic
        if (!gameState.autoRestartScheduled) {
            gameState.autoRestartScheduled = true;
            // Schedule restart after 1 second (1000ms)
            gameState.autoRestartTimeoutId = setTimeout(() => {
                restartGame(); 
            }, 1000); 
            logGameInfo("Auto-restart scheduled");
        }
    }
    
    // Update Camera always to ensure it snaps back on restart/menu screens
    updateCamera(dt);
    
    // UI Update is continuous in render, but logic can go here
}

function render() {
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Start
init();