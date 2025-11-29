// game.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { 
    gameState, 
    logs,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    PHASE_START,
    PHASE_PLAYING,
    PHASE_PAUSED,
    PHASE_GAME_OVER_WIN,
    PHASE_GAME_OVER_LOSE,
    WORLD_SIZE,
    BUILDING_COUNT,
    ENEMY_COUNT,
    EVAC_SIZE
} from './globals.js';
import { Player, Enemy, Building, EvacuationPoint } from './entities.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting } from './lighting.js';
import { setupRenderer, render } from './renderer.js';
import { InputHandler } from './input_handler.js';
import get_automated_testing_action from './automated_testing_controller.js';

let inputHandler;

// Seed random
Math.seedrandom(42);

function init() {
    // Create scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x2a2f36);
    gameState.scene.fog = new THREE.Fog(0x2a2f36, 50, 200);
    
    // Setup renderer
    setupRenderer();
    
    // Setup camera
    setupCamera();
    
    // Setup lighting
    setupLighting();
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2d3238,
        roughness: 0.9
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    gameState.scene.add(ground);
    
    // Setup input
    inputHandler = new InputHandler();
    
    // Initialize game
    initGame();
    
    // Log initial state
    logs.game_info.push({
        data: { phase: PHASE_START },
        framecount: 0,
        timestamp: Date.now()
    });
    
    // Start game loop
    gameLoop();
}

function initGame() {
    // Clear existing entities
    gameState.entities = [];
    gameState.buildings = [];
    gameState.enemies = [];
    
    // Create player
    gameState.player = new Player(0, 0);
    
    // Create buildings
    for (let i = 0; i < BUILDING_COUNT; i++) {
        const x = (Math.random() - 0.5) * (WORLD_SIZE - 40);
        const z = (Math.random() - 0.5) * (WORLD_SIZE - 40);
        const type = Math.floor(Math.random() * 3);
        gameState.buildings.push(new Building(x, z, type));
    }
    
    // Create enemies
    for (let i = 0; i < ENEMY_COUNT; i++) {
        const x = (Math.random() - 0.5) * (WORLD_SIZE - 80);
        const z = (Math.random() - 0.5) * (WORLD_SIZE - 80);
        gameState.enemies.push(new Enemy(x, z));
    }
    
    // Create evacuation point
    const evacX = WORLD_SIZE / 2 - 20;
    const evacZ = WORLD_SIZE / 2 - 20;
    gameState.evacuationPoint = new EvacuationPoint(evacX, evacZ);
    
    // Reset counters
    gameState.buildingsScavenged = 0;
    gameState.enemiesDefeated = 0;
    gameState.score = 0;
    gameState.frameCount = 0;
    gameState.lastTime = Date.now();
}

function updateGame() {
    gameState.frameCount++;
    
    const currentTime = Date.now();
    const deltaTime = Math.min((currentTime - gameState.lastTime) / 1000, 0.1);
    gameState.lastTime = currentTime;
    gameState.deltaTime = deltaTime;
    
    // Get inputs
    let inputs;
    if (gameState.controlMode === "HUMAN") {
        inputs = inputHandler.getInputs();
    } else {
        const action = get_automated_testing_action(gameState);
        inputHandler.updateFromAutomatedTesting(action);
        inputs = inputHandler.getInputs();
    }
    
    // Update player
    gameState.player.update(deltaTime, inputs);
    
    // Update enemies
    for (let enemy of gameState.enemies) {
        if (!enemy.dead) {
            enemy.update(gameState.player);
        }
    }
    
    // Check player attacks
    if (gameState.player.attacking) {
        const attackPoint = gameState.player.getAttackPoint();
        
        for (let enemy of gameState.enemies) {
            if (enemy.dead) continue;
            
            if (enemy.checkHit(attackPoint.x, attackPoint.z, 3)) {
                enemy.takeDamage(25);
                if (enemy.dead) {
                    gameState.enemiesDefeated++;
                    gameState.score += 100;
                }
            }
        }
    }
    
    // Check building scavenging
    for (let building of gameState.buildings) {
        if (building.canScavenge(gameState.player.mesh.position.x, 
                                 gameState.player.mesh.position.z)) {
            const loot = building.scavenge(gameState.player);
            if (loot) {
                gameState.buildingsScavenged++;
                gameState.score += 50;
            }
        }
    }
    
    // Update evacuation point
    gameState.evacuationPoint.update();
    
    // Check win condition
    const dx = gameState.evacuationPoint.mesh.position.x - gameState.player.mesh.position.x;
    const dz = gameState.evacuationPoint.mesh.position.z - gameState.player.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist < EVAC_SIZE) {
        gameState.gamePhase = PHASE_GAME_OVER_WIN;
        logs.game_info.push({
            data: { phase: PHASE_GAME_OVER_WIN, reason: "evacuation" },
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
        return;
    }
    
    // Check lose conditions
    if (gameState.player.health <= 0 || 
        gameState.player.hunger <= 0 || 
        gameState.player.thirst <= 0 || 
        gameState.player.radiation >= 100) {
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        logs.game_info.push({
            data: { 
                phase: PHASE_GAME_OVER_LOSE,
                health: gameState.player.health,
                hunger: gameState.player.hunger,
                thirst: gameState.player.thirst,
                radiation: gameState.player.radiation
            },
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
    
    // Update camera
    updateCamera();
}

function gameLoop() {
    requestAnimationFrame(gameLoop);
    
    if (gameState.gamePhase === PHASE_PLAYING) {
        updateGame();
    }
    
    render();
}

// Handle phase transitions
document.addEventListener('keydown', (e) => {
    logs.inputs.push({
        input_type: "keydown",
        data: { key: e.key, keyCode: e.keyCode },
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
    
    if (e.keyCode === 13) { // ENTER
        if (gameState.gamePhase === PHASE_START) {
            gameState.gamePhase = PHASE_PLAYING;
            gameState.lastTime = Date.now();
            logs.game_info.push({
                data: { phase: PHASE_PLAYING },
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    } else if (e.keyCode === 27) { // ESC
        if (gameState.gamePhase === PHASE_PLAYING) {
            gameState.gamePhase = PHASE_PAUSED;
            logs.game_info.push({
                data: { phase: PHASE_PAUSED },
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        } else if (gameState.gamePhase === PHASE_PAUSED) {
            gameState.gamePhase = PHASE_PLAYING;
            gameState.lastTime = Date.now();
            logs.game_info.push({
                data: { phase: PHASE_PLAYING },
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    } else if (e.keyCode === 82) { // R
        if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
            gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
            gameState.gamePhase = PHASE_START;
            initGame();
            logs.game_info.push({
                data: { phase: PHASE_START },
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }
});

document.addEventListener('keyup', (e) => {
    logs.inputs.push({
        input_type: "keyup",
        data: { key: e.key, keyCode: e.keyCode },
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
});

// Control mode switching
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    
    const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 
                     'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
    
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.remove('active');
    });
    
    const modeMap = {
        'HUMAN': 'humanModeBtn',
        'TEST_1': 'test_1_ModeBtn',
        'TEST_2': 'test_2_ModeBtn',
        'TEST_3': 'test_3_ModeBtn',
        'TEST_4': 'test_4_ModeBtn',
        'TEST_5': 'test_5_ModeBtn'
    };
    
    const activeBtn = document.getElementById(modeMap[mode]);
    if (activeBtn) activeBtn.classList.add('active');
};

// Start game
init();