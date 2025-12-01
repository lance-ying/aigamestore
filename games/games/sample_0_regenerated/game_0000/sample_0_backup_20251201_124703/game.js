import { gameState, initLogs, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_LENGTH } from './globals.js';
import { Player } from './entities.js';
import { resetLevel } from './level_generator.js';
import { handleInput } from './input.js';
import { renderUI, renderStartScreen, renderPausedScreen, renderGameOverScreen } from './ui.js';
import { updateParticles, renderParticles } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initLogs(p);
        
        // Initial reset
        setupGame();
    };
    
    function setupGame() {
        gameState.score = 0;
        gameState.coins = 0;
        gameState.particles = [];
        
        resetLevel();
        gameState.player = new Player(100, 200);
        
        // Log initial state
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    p.draw = function() {
        // Handle Automated Testing Inputs
        if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                // Simulate press
                if (!gameState.keys[action.keyCode]) {
                     handleInput(p, 'pressed', '', action.keyCode);
                     // Auto release next frame simulation (simplified)
                     setTimeout(() => handleInput(p, 'released', '', action.keyCode), 100);
                }
            }
        }

        // Global updates
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // Render Background
        p.background(100, 190, 255); // Sky
        
        // Handle Phases
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
                
            case "PLAYING":
                updateGameLogic();
                renderGameWorld(p);
                renderUI(p);
                break;
                
            case "PAUSED":
                renderGameWorld(p);
                renderUI(p);
                renderPausedScreen(p);
                break;
                
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGameWorld(p);
                renderUI(p);
                renderGameOverScreen(p);
                
                // Check if user pressed R (handled in input.js but we need to reset here if detected)
                // Since input.js sets phase to START, we can detect transition or just rely on state.
                // However, input.js sets phase to START, but doesn't call setupGame().
                // We should check if we need to re-init.
                // Logic moved: input.js sets phase to START. We detect that and if player is dead/win, reset.
                // Actually, best place is in keyPressed in input.js, but let's just re-init when entering START from GameOver.
                // Simpler: input.js sets phase. We check here if we are in start but player is old.
                break;
        }
    };
    
    function updateGameLogic() {
        if (!gameState.player) return;
        
        gameState.player.update(p);
        
        // Update Camera to follow player
        // Camera target X: keep player at 1/3 of screen
        let targetCamX = gameState.player.x - 200;
        
        // Clamp camera
        targetCamX = Math.max(0, Math.min(targetCamX, LEVEL_LENGTH - CANVAS_WIDTH));
        
        // Smooth lerp
        gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.1);
        
        // Update Entities
        gameState.enemies.forEach(e => e.update());
        gameState.collectibles.forEach(c => {
             // Basic animation updates if needed
        });
        
        updateParticles();
        
        // Cleanup off-screen entities (optimization)
        cleanupEntities();
        
        // Logging
        if (p.frameCount % 10 === 0) { // Log every 10 frames to save memory
             p.logs.player_info.push({
                screen_x: gameState.player.x - gameState.cameraX,
                screen_y: gameState.player.y,
                game_x: gameState.player.x,
                game_y: gameState.player.y,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }
    
    function renderGameWorld(p) {
        p.push();
        p.translate(-gameState.cameraX, 0);
        
        // Draw Decorations (Clouds etc) - Static for now or procedurally generated in draw for parallax?
        // Let's just draw some clouds based on world position
        p.fill(255, 255, 255, 200);
        p.noStroke();
        for (let x = 0; x < LEVEL_LENGTH; x += 300) {
            p.ellipse(x + 100, 100, 80, 50);
            p.ellipse(x + 140, 110, 70, 40);
        }
        
        // Draw Decor entities (Flagpole)
        gameState.decorations.forEach(d => d.render(p));
        
        // Draw Platforms
        gameState.platforms.forEach(plat => {
            if (isOnScreen(plat)) plat.render(p);
        });
        
        // Draw Collectibles
        gameState.collectibles.forEach(c => {
            if (isOnScreen(c)) c.render(p);
        });
        
        // Draw Enemies
        gameState.enemies.forEach(e => {
            if (isOnScreen(e)) e.render(p);
        });
        
        // Draw Particles
        renderParticles(p);
        
        // Draw Player
        if (gameState.player) gameState.player.render(p);
        
        p.pop();
    }
    
    function isOnScreen(entity) {
        return (entity.x + entity.width > gameState.cameraX && 
                entity.x < gameState.cameraX + CANVAS_WIDTH);
    }
    
    function cleanupEntities() {
        // Remove dead enemies/collected coins
        gameState.enemies = gameState.enemies.filter(e => !e.markedForDeletion && e.x > gameState.cameraX - 100);
        gameState.collectibles = gameState.collectibles.filter(c => !c.markedForDeletion && c.x > gameState.cameraX - 100);
        
        // Note: Don't remove platforms aggressively or we can't go back (though auto runner doesnt go back)
        // Ideally keep platforms for a bit longer
        gameState.platforms = gameState.platforms.filter(p => p.x + p.width > gameState.cameraX - 200);
    }

    p.keyPressed = function() {
        // Handle restarts specifically here to trigger setupGame
        if (p.keyCode === 82 && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
            setupGame(); // Reset data
            // Phase set to START in input.js
        }
        
        handleInput(p, 'pressed', p.key, p.keyCode);
    };

    p.keyReleased = function() {
        handleInput(p, 'released', p.key, p.keyCode);
    };
});

window.gameInstance = gameInstance;