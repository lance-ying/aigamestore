import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, ORIGINAL_BOX_SIZE, MOVE_SPEED_INITIAL } from './globals.js';
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
    gameState.scene.background = new THREE.Color(0xd0d0d0); // Light gray default
    
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
    
    // Init logs
    logGameState();
}

function startGame() {
    // Reset State
    gameState.stack.forEach(b => gameState.scene.remove(b.mesh));
    gameState.debris.forEach(d => gameState.scene.remove(d.mesh));
    if (gameState.activeBlock) gameState.scene.remove(gameState.activeBlock.mesh);
    
    gameState.stack = [];
    gameState.debris = [];
    gameState.activeBlock = null;
    gameState.score = 0;
    gameState.blockSpeed = MOVE_SPEED_INITIAL;
    gameState.currentHue = 0;
    
    // Reset Camera
    gameState.camera.position.set(20, 20, 20);
    gameState.camera.lookAt(0, 0, 0);
    
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
        // Log input
        if (window.logs) {
            window.logs.inputs.push({
                key: e.key,
                keyCode: e.keyCode,
                frame: gameState.frameCount,
                time: Date.now()
            });
        }
        
        switch (e.keyCode) {
            case 13: // ENTER
                if (gameState.gamePhase === "START") {
                    startGame();
                }
                break;
            case 32: // SPACE
                if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
                    handleAction();
                }
                break;
            case 27: // ESC
                if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
                else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
                break;
            case 82: // R
                if (gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "GAME_OVER_WIN") {
                    startGame();
                }
                break;
        }
    });
    
    // Global function for automation
    window.setControlMode = (mode) => {
        gameState.controlMode = mode;
        console.log("Control Mode set to:", mode);
        // Force restart if changing modes
        gameState.gamePhase = "START";
    };
}

function handleAction() {
    if (gameState.gamePhase !== "PLAYING") return;
    
    const success = placeBlock();
    
    if (success) {
        gameState.score++;
        spawnNextBlock();
    } else {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
}

// Logic update
function update(dt) {
    if (gameState.gamePhase === "PLAYING") {
        
        // Automated Testing Logic
        if (gameState.controlMode === "TEST_1") {
            // Basic placement: Press space when overlap > 0
            if (gameState.activeBlock) {
                // Determine if close enough (simple distance check)
                const ab = gameState.activeBlock;
                const pb = gameState.stack[gameState.stack.length-1];
                const axis = ab.moveAxis;
                const dist = axis === 'x' ? Math.abs(ab.mesh.position.x - pb.mesh.position.x) : Math.abs(ab.mesh.position.z - pb.mesh.position.z);
                
                // Trigger if overlap is good (e.g. within 1 unit)
                if (dist < 1.0) {
                    handleAction();
                }
            }
        } else if (gameState.controlMode === "TEST_2") {
            // Perfect placement (God mode)
            if (gameState.activeBlock) {
                const ab = gameState.activeBlock;
                const pb = gameState.stack[gameState.stack.length-1];
                
                // Snap to perfect position immediately to simulate perfect timing/luck
                if (ab.moveAxis === 'x') ab.mesh.position.x = pb.mesh.position.x;
                else ab.mesh.position.z = pb.mesh.position.z;
                
                handleAction();
            }
        } else if (gameState.controlMode === "TEST_3") {
            // Fail test
            if (gameState.activeBlock) {
                const ab = gameState.activeBlock;
                const pb = gameState.stack[gameState.stack.length-1];
                const axis = ab.moveAxis;
                const dist = axis === 'x' ? Math.abs(ab.mesh.position.x - pb.mesh.position.x) : Math.abs(ab.mesh.position.z - pb.mesh.position.z);
                const size = axis === 'x' ? ab.width : ab.depth;
                
                // Wait until NO overlap
                if (dist > size + 0.5) {
                    handleAction();
                }
            }
        }

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
        
        // Update Background Color (Cycle nicely)
        // A nice gradient effect is hard with simple clearColor, but we can shift the solid color
        // gameState.scene.background.setHSL(gameState.currentHue, 0.3, 0.8);
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
    
    // Log occasionally
    if (gameState.frameCount % 60 === 0) {
        logGameState();
    }
}

function logGameState() {
    if (window.logs) {
        window.logs.game_info.push({
            phase: gameState.gamePhase,
            score: gameState.score,
            stackHeight: gameState.stack.length,
            fps: Math.round(1 / gameState.deltaTime),
            timestamp: Date.now()
        });
        
        if (gameState.activeBlock) {
            window.logs.player_info.push({
                x: gameState.activeBlock.mesh.position.x,
                y: gameState.activeBlock.mesh.position.y,
                z: gameState.activeBlock.mesh.position.z,
                axis: gameState.activeBlock.moveAxis,
                timestamp: Date.now()
            });
        }
    }
}

// Start
init();