// game.js - Main game file with p5.js instance mode

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, 
         TASK_DEFINITIONS, ITEM_TYPES } from './globals.js';
import { Goose, Villager, Item, Obstacle } from './entities.js';
import { handleKeyPress, handleKeyRelease, applyAutomatedControl, inputState } from './input.js';
import { renderStartScreen, renderHUD, renderPausedOverlay, renderGameOver } from './ui.js';
import { initializeWorld, renderWorld } from './world.js';
import { updateCamera } from './physics.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    // Initialize logs (write-only!)
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
    
    // ========================================================================
    // SETUP
    // ========================================================================
    
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42); // Set seed once, never again!
        
        // Initialize game state
        gameState.gamePhase = "START";
        gameState.controlMode = "HUMAN";
        gameState.frameCount = 0;
        gameState.lastFrameTime = p.millis();
        
        // Log initial state
        p.logs.game_info.push({
            data: { gamePhase: "START" },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };
    
    // ========================================================================
    // DRAW LOOP
    // ========================================================================
    
    p.draw = function() {
        // Update frame count and delta time
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        
        // CRITICAL: Exactly one background call
        p.background(135, 206, 235); // Sky blue
        
        // Update and render based on game phase
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
                
            case "PLAYING":
                updatePlaying(p);
                renderPlaying(p);
                break;
                
            case "PAUSED":
                renderPlaying(p);
                renderPausedOverlay(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderPlaying(p);
                renderGameOver(p);
                break;
        }
    };
    
    // ========================================================================
    // UPDATE PLAYING
    // ========================================================================
    
    function updatePlaying(p) {
        // Apply automated control if needed
        applyAutomatedControl(p);
        
        // Update player
        if (gameState.player) {
            gameState.player.update(p, inputState.keys);
        }
        
        // Update camera
        updateCamera(gameState.player, 0.1);
        
        // Update villagers
        gameState.villagers.forEach(villager => {
            villager.update(p);
        });
        
        // Update items
        gameState.items.forEach(item => {
            item.update(p);
        });
        
        // Update particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            gameState.particles[i].update();
            if (gameState.particles[i].isDead()) {
                gameState.particles.splice(i, 1);
            }
        }
        
        // Update honk effects
        for (let i = gameState.honkEffects.length - 1; i >= 0; i--) {
            gameState.honkEffects[i].update();
            if (gameState.honkEffects[i].isDead()) {
                gameState.honkEffects.splice(i, 1);
            }
        }
    }
    
    // ========================================================================
    // RENDER PLAYING
    // ========================================================================
    
    function renderPlaying(p) {
        // Render world
        renderWorld(p);
        
        // Render items
        gameState.items.forEach(item => {
            item.render(p);
        });
        
        // Render villagers
        gameState.villagers.forEach(villager => {
            villager.render(p);
        });
        
        // Render player
        if (gameState.player) {
            gameState.player.render(p);
        }
        
        // Render carried item
        if (gameState.player && gameState.player.carrying) {
            const item = gameState.player.carrying;
            const screenX = gameState.player.x - gameState.cameraX;
            const screenY = gameState.player.y - gameState.cameraY - 20;
            
            p.push();
            p.translate(screenX, screenY);
            item.render(p);
            p.pop();
        }
        
        // Render honk effects
        gameState.honkEffects.forEach(effect => {
            effect.render(p);
        });
        
        // Render particles
        gameState.particles.forEach(particle => {
            particle.render(p);
        });
        
        // Render HUD
        renderHUD(p);
    }
    
    // ========================================================================
    // GAME INITIALIZATION
    // ========================================================================
    
    function initializeGame(p) {
        // Clear existing entities
        gameState.entities = [];
        gameState.villagers = [];
        gameState.items = [];
        gameState.obstacles = [];
        gameState.tasks = [];
        gameState.particles = [];
        gameState.honkEffects = [];
        
        // Initialize world
        initializeWorld(p);
        
        // Create player
        gameState.player = new Goose(200, 200);
        
        // Create tasks from definitions
        gameState.tasks = TASK_DEFINITIONS.map(def => ({...def}));
        gameState.totalTasks = gameState.tasks.length;
        gameState.tasksCompleted = 0;
        
        // Create items for tasks
        createGameItems();
        
        // Create villagers
        createVillagers();
        
        // Reset score
        gameState.score = 0;
        
        // Log game start
        p.logs.game_info.push({
            data: { 
                gamePhase: "PLAYING",
                totalTasks: gameState.totalTasks
            },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
    
    function createGameItems() {
        // Hat in garden
        const hat = new Item(150, 150, ITEM_TYPES.HAT, 1);
        
        // Bell in garden
        const bell = new Item(280, 180, ITEM_TYPES.BELL, 2);
        
        // Rake near shops
        const rake = new Item(650, 220, ITEM_TYPES.RAKE, 3);
        
        // Glasses in village green
        const glasses = new Item(850, 450, ITEM_TYPES.GLASSES, 4);
        
        // Radio in shops
        const radio = new Item(700, 150, ITEM_TYPES.RADIO, 5);
    }
    
    function createVillagers() {
        // Gardener - patrols garden area
        const gardener = new Villager(180, 180, [
            { x: 150, y: 150 },
            { x: 250, y: 150 },
            { x: 250, y: 250 },
            { x: 150, y: 250 }
        ]);
        gardener.ownedItem = gameState.items.find(i => i.type === ITEM_TYPES.HAT);
        
        // Shopkeeper - patrols shop area
        const shopkeeper = new Villager(650, 180, [
            { x: 600, y: 150 },
            { x: 750, y: 150 },
            { x: 750, y: 250 },
            { x: 600, y: 250 }
        ]);
        shopkeeper.ownedItem = gameState.items.find(i => i.type === ITEM_TYPES.RAKE);
        
        // Boy with glasses - patrols village green
        const boy = new Villager(850, 450, [
            { x: 800, y: 450 },
            { x: 900, y: 450 },
            { x: 900, y: 550 },
            { x: 800, y: 550 }
        ]);
        boy.ownedItem = gameState.items.find(i => i.type === ITEM_TYPES.GLASSES);
        
        // Woman near pond - patrols pond area
        const woman = new Villager(250, 600, [
            { x: 200, y: 550 },
            { x: 350, y: 550 },
            { x: 350, y: 650 },
            { x: 200, y: 650 }
        ]);
        
        // Market vendor - patrols near shops
        const vendor = new Villager(700, 280, [
            { x: 650, y: 280 },
            { x: 750, y: 280 },
            { x: 750, y: 330 },
            { x: 650, y: 330 }
        ]);
        vendor.ownedItem = gameState.items.find(i => i.type === ITEM_TYPES.RADIO);
    }
    
    // ========================================================================
    // INPUT HANDLERS
    // ========================================================================
    
    p.keyPressed = function() {
        handleKeyPress(p);
        
        // Initialize game when starting
        if (p.keyCode === 13 && gameState.gamePhase === "START") {
            initializeGame(p);
        }
    };
    
    p.keyReleased = function() {
        handleKeyRelease(p);
    };
    
    // Expose initialization for input.js
    window.initializeGame = () => initializeGame(p);
});

// Expose game instance globally
window.gameInstance = gameInstance;

// ========================================================================
// CONTROL MODE MANAGEMENT
// ========================================================================

window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    
    // Update button states
    const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.classList.remove('active');
        }
    });
    
    const modeMap = {
        'HUMAN': 'humanModeBtn',
        'TEST_1': 'test_1_ModeBtn',
        'TEST_2': 'test_2_ModeBtn'
    };
    
    const activeBtn = document.getElementById(modeMap[mode]);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
};