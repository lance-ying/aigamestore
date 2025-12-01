import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, log } from './globals.js';
import { Player } from './entities.js';
import { generateMap } from './map.js';
import { STARTING_DECK, getCardData } from './card_definitions.js';
import { renderUI } from './ui.js';
import { handleInput } from './input.js';
import { updateParticles, renderParticles } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = { "game_info": [], "inputs": [], "player_info": [] };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initializeGame();
        
        // Log start
        log("game_info", { action: "game_start" }, p);
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // Automated Testing
        const autoAction = get_automated_testing_action(gameState);
        if (autoAction && p.frameCount % 10 === 0) { // Throttle inputs
             handleKeyPress(autoAction.keyCode);
        }

        // Draw Background
        p.background(30, 30, 40);
        
        // Render UI and Screens
        renderUI(p);
        
        // Render Entities and Particles on top if in battle
        if (gameState.gamePhase === "BATTLE") {
            p.push();
            // Translate for combat view? Already handled in render
            
            // Draw Player
            gameState.player.render(p);
            
            // Draw Enemies
            gameState.combat.enemies.forEach(e => {
                if (!e.isDead) e.render(p);
            });
            
            p.pop();
        }
        
        updateParticles();
        renderParticles(p);
        
        // Log Player Info infrequently
        if (p.frameCount % 60 === 0 && gameState.player) {
            log("player_info", { 
                hp: gameState.player.currentHp, 
                gold: gameState.gold,
                phase: gameState.gamePhase 
            }, p);
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p.keyCode);
    };
    
    function handleKeyPress(keyCode) {
        log("inputs", { keyCode: keyCode }, p);
        handleInput(p, keyCode);
    }
});

function initializeGame() {
    gameState.gamePhase = "START";
    gameState.floor = 0;
    gameState.gold = 99;
    
    // Create Player
    gameState.player = new Player();
    
    // Create Deck
    gameState.deck = STARTING_DECK.map(id => getCardData(id));
    
    // Generate Map
    generateMap();
}

// Hook for control mode (called from HTML buttons)
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Reset game if needed or just continue
    if (gameState.gamePhase !== "START") {
        initializeGame();
    }
};

window.gameInstance = gameInstance;