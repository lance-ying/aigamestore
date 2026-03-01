import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, updatePalette, SPEED_INCREMENT, STARTING_SPEED } from './globals.js';
import { Player } from './entities.js';
import { setupInput, setGamePhase } from './input.js';
import { physicsSystem } from './physics.js';
import { setupCamera, updateCamera } from './camera.js';
import { initLevel, updateLevelGenerator } from './level_generator.js';
import { setupUI, renderUI } from './ui.js';

// Setup Renderer
function setupRenderer() {
    // Container
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.width = `${CANVAS_WIDTH}px`;
    container.style.height = `${CANVAS_HEIGHT}px`;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    gameState.gameContainer = container;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    gameState.renderer = renderer;
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(gameState.palette.background);
    scene.fog = new THREE.Fog(gameState.palette.background, 20, 60);
    gameState.scene = scene;
    
    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    scene.add(dirLight);
    
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
}

// Game Initialization
function init() {
    setupRenderer();
    setupUI();
    setupCamera();
    setupInput();
    
    // Expose reset to window for input.js and console
    window.gameInstance = {
        reset: resetGame
    };
    
    // Initial Reset (Prepares start screen)
    resetGame();
    gameState.gamePhase = "START"; // Override reset's START logic if needed
    
    // Start Loop
    requestAnimationFrame(gameLoop);
}

// Reset Game Logic
function resetGame() {
    // Clear entities
    if (gameState.player) {
        gameState.scene.remove(gameState.player.mesh);
        gameState.player = null;
    }
    
    gameState.platforms.forEach(p => {
        gameState.scene.remove(p.mesh);
        if(p.mesh.geometry) p.mesh.geometry.dispose();
    });
    gameState.platforms = [];
    
    gameState.collectibles.forEach(c => {
        gameState.scene.remove(c.mesh);
    });
    gameState.collectibles = [];
    
    gameState.particles.forEach(p => {
        gameState.scene.remove(p.mesh);
    });
    gameState.particles = [];
    
    // Reset Stats
    gameState.score = 0;
    gameState.gemsCollected = 0;
    gameState.currentSpeed = STARTING_SPEED; // Use constant
    gameState.frameCount = 0;
    
    // Reset Level
    initLevel();
    
    // Create Player
    gameState.player = new Player();
    
    // Reset Camera
    gameState.currentCameraOffset = null; // Forces reset in updateCamera
    
    // Reset Phase
    setGamePhase("START");
}

// Main Loop
let lastTime = performance.now();
function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    
    const dt = (currentTime - lastTime) / 16.666; // Normalize to ~60FPS = 1.0
    gameState.deltaTime = dt / 60; // seconds
    lastTime = currentTime;
    
    gameState.frameCount++;
    
    if (gameState.gamePhase === "PLAYING") {
        // Update Game Logic
        
        // Speed scaling
        gameState.currentSpeed += SPEED_INCREMENT * dt;
        
        // Update Entities
        if (gameState.player) gameState.player.update(dt);
        gameState.collectibles.forEach(c => c.update(dt));
        
        // Physics
        physicsSystem.update(dt);
        
        // Level Generation
        updateLevelGenerator();
        
        // Camera
        updateCamera();
        
        // Score update (distance based)
        gameState.score += gameState.currentSpeed * 0.5;
        
        // Palette Update
        updatePalette(gameState.score * 0.0001);
        gameState.scene.background.setHex(gameState.palette.background);
        gameState.scene.fog.color.setHex(gameState.palette.background);
        
        // Automated Tests Hooks
        runAutomatedTests();
    }
    
    // Render
    gameState.renderer.render(gameState.scene, gameState.camera);
    renderUI();
}

// Automated Testing Logic
function runAutomatedTests() {
    if (gameState.controlMode === "HUMAN") return;
    
    const player = gameState.player;
    if (!player) return;
    
    // TEST_1: Verify forward movement
    if (gameState.controlMode === "TEST_1") {
        if (gameState.frameCount === 60) {
            if (player.mesh.position.z < -1) {
                console.log("TEST_1 PASSED: Player moving forward");
            } else {
                console.error("TEST_1 FAILED: Player did not move forward");
            }
        }
    }
    
    // TEST_2: Jump Test
    if (gameState.controlMode === "TEST_2") {
        if (gameState.frameCount === 10) player.jump();
        if (gameState.frameCount === 30) {
            if (player.mesh.position.y > 2.0) {
                 console.log("TEST_2 PASSED: Jump execution confirmed");
            }
        }
    }
    
    // TEST_3: Turn Test
    if (gameState.controlMode === "TEST_3") {
        if (gameState.frameCount === 10) player.turn("RIGHT");
        if (gameState.frameCount === 20) {
            if (player.velocity.x > 0) {
                 console.log("TEST_3 PASSED: Turn execution confirmed");
            }
        }
    }
    
    // TEST_5: Game Over Test (Suicide)
    if (gameState.controlMode === "TEST_5") {
        if (gameState.frameCount === 10) player.turn("RIGHT"); // Turn off edge
        // Wait for fall
    }
}

// Global Control Mode Setter
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    resetGame();
    if(mode !== "HUMAN") {
        setGamePhase("PLAYING"); // Auto start for tests
    }
};

// Start
init();
</code >

<code filename="physics.js">
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GRAVITY, MAX_FALL_Y } from './globals.js';

export class PhysicsSystem {
    constructor() {
        this.collisionList = [];
    }
    
    update(dt) {
        // Update Player Physics
        if (gameState.player) {
            this.updateEntity(gameState.player, dt);
            
            // Check Ground Collision
            let onGround = false;
            let platformY = -1000;
            
            // Optimization: Only check platforms near the player
            // Spatial partitioning would be better, but linear scan of nearby is okay for this runner
            // We can filter by distance or simply iterate active platforms
            
            const playerBox = new THREE.Box3().setFromObject(gameState.player.mesh);
            // Shrink box slightly for forgiving gameplay
            playerBox.expandByScalar(-0.2); 
            
            for (const platform of gameState.platforms) {
                // Simple distance cull
                if (platform.mesh.position.distanceToSquared(gameState.player.mesh.position) > 100) continue;
                
                const platformBox = new THREE.Box3().setFromObject(platform.mesh);
                
                // Check intersection
                if (playerBox.intersectsBox(platformBox)) {
                    // Check if strictly above
                    // We want the player to land ON TOP, not intersect from side
                    const playerBottom = gameState.player.mesh.position.y - gameState.player.radius;
                    const platformTop = platform.mesh.position.y + platform.height / 2;
                    
                    // Tightened tolerance from 0.2 to 0.05 to prevent snapping when falling down the side
                    if (playerBottom >= platformTop - 0.05 && gameState.player.velocity.y <= 0) {
                        onGround = true;
                        platformY = platformTop + gameState.player.radius;
                        // Snap to top
                        if (gameState.player.mesh.position.y < platformY) {
                            gameState.player.mesh.position.y = platformY;
                        }
                        break; // Found ground
                    }
                }
            }
            
            gameState.player.onGround = onGround;
            if (onGround) {
                gameState.player.velocity.y = 0;
            }
            
            // Collectibles Collision
            for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
                const gem = gameState.collectibles[i];
                if (gem.mesh.position.distanceTo(gameState.player.mesh.position) < (gameState.player.radius + gem.radius)) {
                    gem.collect();
                }
            }
            
            // Check Kill Condition
            if (gameState.player.mesh.position.y < MAX_FALL_Y) {
                gameState.player.die();
            }
        }
        
        // Update Particles Physics
        gameState.particles.forEach(p => p.update(dt));
    }
    
    updateEntity(entity, dt) {
        // Apply Gravity
        if (!entity.onGround) {
            entity.velocity.add(GRAVITY.clone().multiplyScalar(entity.mass)); // dt is implicit in fixed step physics usually, but here frame based
        }
        
        // Apply Velocity
        entity.mesh.position.add(entity.velocity.clone().multiplyScalar(1.0)); // scale by 1 for frame logic
        
        // Friction? No friction in air for this game, constant speed forward
    }
}

export const physicsSystem = new PhysicsSystem();