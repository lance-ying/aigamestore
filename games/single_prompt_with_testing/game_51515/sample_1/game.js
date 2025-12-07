/**
 * Main Game Entry Point
 */
import { 
    gameState, getGameState, resetGame,
    CANVAS_WIDTH, CANVAS_HEIGHT, WALL_OF_DOOM_SPEED
} from './globals.js';
import { Player } from './entities.js';
import { initDungeon, updateDungeon } from './dungeon.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { handleInput, keys, KEY_ENTER, KEY_R, KEY_ESC } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Expose setters for HTML buttons
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Visual feedback handled by HTML/CSS via class toggling usually, 
    // but here we just update state.
    // Update button styles manually if needed
    document.querySelectorAll('.control-button').forEach(btn => btn.classList.remove('active'));
    if(mode === 'HUMAN') document.getElementById('humanModeBtn').classList.add('active');
    if(mode === 'TEST_1') document.getElementById('test_1_ModeBtn').classList.add('active');
    if(mode === 'TEST_2') document.getElementById('test_2_ModeBtn').classList.add('active');
};

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Initialize Logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        resetGame();

        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // --- Automated Testing Inputs ---
        if (gameState.controlMode.startsWith("TEST") && gameState.gamePhase === "PLAYING") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                // Simulate key press for one frame
                keys[action.keyCode] = true;
                // We need to simulate release next frame or shortly after for some logic,
                // but for movement (continuous) we might need it held. 
                // The test controller runs every frame.
                // However, keys object needs to be cleared if not asserted? 
                // Simpler: Reset keys every frame for AI, or AI manages state.
                // Let's reset AI keys every frame at start of draw for simplicity in this architecture
                // But that breaks manual hold. 
                // For this implementation: AI sets key true. We need to set it false if AI doesn't pick it.
                // To support holding:
                // We'll reset all keys if in TEST mode at the START of draw (logic below).
            }
        }
        
        // Render
        p.background(20, 15, 20); // Dark dungeon bg

        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGameLogic(p);
                renderGameWorld(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGameWorld(p);
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGameWorld(p);
                renderGameOver(p);
                break;
        }

        // Cleanup AI keys for next frame
        if (gameState.controlMode.startsWith("TEST")) {
             // Simply clearing keys might prevent "holding". 
             // The AI function needs to return "Held" keys.
             // Current AI implementation returns single keycode. 
             // We will clear keys at the end of draw for safety in TEST mode.
             Object.keys(keys).forEach(k => keys[k] = false);
        }
    };

    function updateGameLogic(p) {
        // Init player if needed
        if (!gameState.player) {
            gameState.player = new Player(CANVAS_WIDTH/2, CANVAS_HEIGHT - 100);
            initDungeon();
            gameState.wallOfDoomY = CANVAS_HEIGHT + 100;
        }

        // Camera Follow
        // We want player to be roughly in lower middle
        const targetCamY = gameState.player.y - (CANVAS_HEIGHT * 0.6);
        gameState.cameraY = p.lerp(gameState.cameraY, targetCamY, 0.1);

        // Update Wall of Doom
        // Moves up (decreases Y) at constant speed
        gameState.wallOfDoomY -= WALL_OF_DOOM_SPEED;
        // Also keep it close to player if they are super fast? No, it should be a steady threat.
        // But if player is too slow, it eats them.
        
        // Update Dungeon (Procedural Gen)
        updateDungeon(p);

        // Update Entities
        gameState.player.update(p);
        gameState.traps.forEach(t => t.update(p));
        gameState.enemies.forEach(e => e.update(p));
        gameState.particles.forEach(part => part.update());
        
        // Remove dead particles
        gameState.particles = gameState.particles.filter(p => !p.isDead());

        // Log Player
        if (p.frameCount % 60 === 0) { // Log every second to save perf
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                score: gameState.score,
                framecount: p.frameCount
            });
        }
    }

    function renderGameWorld(p) {
        // Safety translation
        p.push();
        // Camera handled in entity render methods mostly, but we could translate here globally.
        // Entity render methods use manual subtraction of cameraY.
        // Let's render "Wall of Doom" here globally as it's a world event.
        
        // Render Wall of Doom
        let screenWallY = gameState.wallOfDoomY - gameState.cameraY;
        if (screenWallY < CANVAS_HEIGHT) {
            p.fill(100, 0, 0); // Dark red solid
            p.rect(0, screenWallY, CANVAS_WIDTH, CANVAS_HEIGHT * 2); // Extend downwards
            
            // Effect at the edge
            p.fill(255, 50, 0, 100);
            p.rect(0, screenWallY - 20, CANVAS_WIDTH, 40);
            
            // Shake effect if close
            if (screenWallY < CANVAS_HEIGHT && screenWallY > 0) {
                 // screen shake handled by randomization in draw?
                 // Simple rect noise
                 p.fill(255, 0, 0, 50);
                 p.rect(0, screenWallY - 10 - p.random(10), CANVAS_WIDTH, 20);
            }
        }
        
        // Walls
        gameState.walls.forEach(w => w.render(p));
        
        // Traps (under player)
        gameState.traps.forEach(t => t.render(p));
        
        // Coins
        gameState.coins.forEach(c => c.render(p));
        
        // Enemies
        gameState.enemies.forEach(e => e.render(p));
        
        // Player
        if (gameState.player) gameState.player.render(p);
        
        // Particles (on top)
        gameState.particles.forEach(part => part.render(p));

        p.pop();
    }

    p.keyPressed = function() {
        keys[p.keyCode] = true;
        
        // Phase Transitions
        if (p.keyCode === KEY_ENTER && gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            p.logs.game_info.push({ phase: "PLAYING", timestamp: Date.now() });
        }
        
        if (p.keyCode === KEY_ESC) {
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        
        if (p.keyCode === KEY_R && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
            resetGame();
            gameState.gamePhase = "START";
        }

        // Logging
        p.logs.inputs.push({
            type: 'press',
            key: p.key,
            code: p.keyCode,
            frame: p.frameCount
        });
    };

    p.keyReleased = function() {
        keys[p.keyCode] = false;
        
        p.logs.inputs.push({
            type: 'release',
            key: p.key,
            code: p.keyCode,
            frame: p.frameCount
        });
    };
});

window.gameInstance = gameInstance;