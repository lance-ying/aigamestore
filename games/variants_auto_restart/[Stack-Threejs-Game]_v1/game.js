import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, ORIGINAL_BOX_SIZE, MOVE_SPEED_INITIAL, MAX_MISSES } from './globals.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting } from './lighting.js';
import { Block } from './entities.js';
import { placeBlock, spawnNextBlock } from './physics.js';
import { setupUI, renderUI } from './ui.js';
import { hslToHex } from './utils.js';

// Setup Game
function init() {
    // Container
    gameState.gameContainer = document.getElementById('game-container');
    if (!gameState.gameContainer) {
        gameState.gameContainer = document.createElement('div');
        gameState.gameContainer.id = 'game-container';
        gameState.gameContainer.style.width = `${CANVAS_WIDTH}px`;
        gameState.gameContainer.style.height = `${CANVAS_HEIGHT}px`;
        gameState.gameContainer.style.position = 'relative';
        gameState.gameContainer.style.overflow = 'hidden';
        document.body.appendChild(gameState.gameContainer);
    }

    // Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x8B7355); // Start with ground color (brown)
    
    // Renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    gameState.gameContainer.appendChild(gameState.renderer.domElement);
    
    // Setup components
    setupCamera();
    setupLighting();
    setupUI();
    
    // Inputs
    setupInputs();
    
    // Setup game loop
    requestAnimationFrame(gameLoop);
}

function startGame() {
    // Clear any pending auto-restart
    if (gameState.autoRestartTimeoutId) {
        clearTimeout(gameState.autoRestartTimeoutId);
        gameState.autoRestartTimeoutId = null;
        gameState.autoRestartScheduled = false;
    }

    // Reset State
    gameState.stack.forEach(b => gameState.scene.remove(b.mesh));
    gameState.debris.forEach(d => gameState.scene.remove(d.mesh));
    if (gameState.activeBlock) gameState.scene.remove(gameState.activeBlock.mesh);
    
    gameState.stack = [];
    gameState.debris = [];
    gameState.activeBlock = null;
    gameState.score = 0;
    gameState.missCount = 0; // Reset miss count
    gameState.blockSpeed = MOVE_SPEED_INITIAL;
    gameState.currentHue = 0;
    
    // Reset Camera
    gameState.camera.position.set(20, 20, 20);
    gameState.camera.lookAt(0, 0, 0);
    
    // Reset background to ground color
    gameState.scene.background = new THREE.Color(0x8B7355);
    
    // Create Base Block
    const baseBlock = new Block(0, 0, 0, ORIGINAL_BOX_SIZE, ORIGINAL_BOX_SIZE, hslToHex(0, 0.8, 0.6));
    gameState.stack.push(baseBlock);
    gameState.scene.add(baseBlock.mesh);
    
    // Spawn first moving block
    spawnNextBlock();
    
    gameState.gamePhase = "PLAYING";
}

function setupInputs() {
    window.addEventListener('keydown', (e) => {
        switch (e.keyCode) {
            case 13: // ENTER
                if (gameState.gamePhase === "START") {
                    startGame();
                }
                break;
            case 32: // SPACE
                if (gameState.gamePhase === "PLAYING") {
                    handleAction();
                }
                break;
            case 27: // ESC
                if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
                else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
                break;
            case 82: // R
                if (gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "GAME_OVER_WIN") {
                    // Clear any pending auto-restart before manual restart
                    if (gameState.autoRestartTimeoutId) {
                        clearTimeout(gameState.autoRestartTimeoutId);
                        gameState.autoRestartTimeoutId = null;
                        gameState.autoRestartScheduled = false;
                    }
                    startGame();
                }
                break;
        }
    });
}

function handleAction() {
    if (gameState.gamePhase !== "PLAYING") return;
    
    const success = placeBlock();
    
    if (success) {
        gameState.score++;
        spawnNextBlock();
    } else {
        // Game Over condition (missed MAX_MISSES times)
        gameState.gamePhase = "GAME_OVER_LOSE";
        
        // Schedule auto-restart if not already scheduled
        if (!gameState.autoRestartScheduled) {
            gameState.autoRestartScheduled = true;
            gameState.autoRestartTimeoutId = setTimeout(() => {
                startGame();
            }, 1000); // 1 second delay
        }
    }
}

// Update background color based on height - transition from ground to sky
function updateBackground() {
    // Calculate progress based on stack height
    // Start: brown ground color (0x8B7355)
    // Mid: green/grass (0x90EE90) 
    // High: light blue sky (0x87CEEB)
    // Very high: deep blue sky (0x4682B4)
    
    const height = gameState.stack.length;
    
    // Define color transitions
    const groundColor = new THREE.Color(0x8B7355); // Brown
    const grassColor = new THREE.Color(0x90EE90);  // Light green
    const skyColor = new THREE.Color(0x87CEEB);    // Sky blue
    const deepSkyColor = new THREE.Color(0x4682B4); // Deep blue
    
    let targetColor;
    
    if (height <= 5) {
        // Ground to grass (0-5 blocks)
        const t = height / 5;
        targetColor = groundColor.clone().lerp(grassColor, t);
    } else if (height <= 15) {
        // Grass to sky (5-15 blocks)
        const t = (height - 5) / 10;
        targetColor = grassColor.clone().lerp(skyColor, t);
    } else {
        // Sky to deep sky (15+ blocks)
        const t = Math.min((height - 15) / 20, 1);
        targetColor = skyColor.clone().lerp(deepSkyColor, t);
    }
    
    gameState.scene.background = targetColor;
}

// Logic update
function update(dt) {
    if (gameState.gamePhase === "PLAYING") {
        // Update Active Block
        if (gameState.activeBlock) {
            gameState.activeBlock.update(dt);
        }
        
        // Update Debris
        for (let i = gameState.debris.length - 1; i >= 0; i--) {
            const d = gameState.debris[i];
            const remove = d.update(dt);
            if (remove) {
                gameState.scene.remove(d.mesh);
                gameState.debris.splice(i, 1);
            }
        }
        
        // Update Camera
        updateCamera();
        
        // Update Background Color based on height
        updateBackground();
    }
}

// Render loop
let lastTime = 0;
function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt
    lastTime = time;
    gameState.deltaTime = dt;
    gameState.frameCount++;
    
    update(dt);
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Start
init();