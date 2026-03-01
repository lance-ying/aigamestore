import { gameState, WAVES, MAPS, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { handleKeyDown, handleKeyUp, processInput } from './input.js';
import { renderBackground, renderUI, renderStartScreen, renderPaused, renderGameOver } from './ui.js';
import { Bloon } from './entities.js';
import { checkCollisions } from './physics.js';
import { updateParticles, renderParticles } from './particles.js';


const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        resetGame();
        
        // Initial Log
        p.logs.game_info.push({
            event: "Game Initialized",
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // Automated Testing Handling removed

        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGameLogic(p);
                drawGame(p);
                break;
            case "PAUSED":
                drawGame(p);
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
                drawGame(p);
                renderGameOver(p, true);
                break;
            case "GAME_OVER_LOSE":
                drawGame(p);
                renderGameOver(p, false);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyDown(p);
    };

    p.keyReleased = function() {
        handleKeyUp(p);
    };
});

window.gameInstance = gameInstance;

window.resetGame = function() {
    gameState.gamePhase = "START";
    
    // Always start campaign from first map
    gameState.mapDifficulty = "EASY";
    
    // Reset level specific state
    initLevelState();
    
    gameState.score = 0;
};

function initLevelState() {
    gameState.levelPath = MAPS[gameState.mapDifficulty].path;
    gameState.money = 650; // Starting cash
    gameState.lives = 50;
    gameState.currentWave = 0;
    gameState.towers = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.waveActive = false;
    gameState.selectedTower = null;
    gameState.cursor = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
}

window.setControlMode = function(mode) {
    // With testing modes removed, this will always be called with 'HUMAN'
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};

function updateGameLogic(p) {
    processInput();
    
    // Wave Spawning
    if (gameState.waveActive && gameState.currentWave < WAVES.length) {
        const waveData = WAVES[gameState.currentWave];
        gameState.waveFrame++;
        
        // Check if we need to spawn next enemy
        if (gameState.enemiesSpawnedInWave < waveData.length) {
            const nextEnemy = waveData[gameState.enemiesSpawnedInWave];
            
            // We use a property on gameState to track delay counter
            if (!gameState.spawnTimer) gameState.spawnTimer = 0;
            gameState.spawnTimer++;
            
            if (gameState.spawnTimer >= nextEnemy.delay) {
                new Bloon(nextEnemy.type);
                gameState.enemiesSpawnedInWave++;
                gameState.spawnTimer = 0;
            }
        } else if (gameState.enemies.length === 0) {
            // Wave Cleared
            gameState.waveActive = false;
            gameState.currentWave++;
            gameState.money += 100 + (gameState.currentWave * 50); // Wave clear bonus
            
            if (gameState.currentWave >= WAVES.length) {
                // Map Complete - Check for next map in sequence
                const mapOrder = ['EASY', 'MEDIUM', 'HARD'];
                const currentIdx = mapOrder.indexOf(gameState.mapDifficulty);
                
                if (currentIdx < mapOrder.length - 1) {
                    // Next Level
                    gameState.mapDifficulty = mapOrder[currentIdx + 1];
                    initLevelState();
                    // Game continues in PLAYING phase
                } else {
                    // All Maps Complete
                    gameState.gamePhase = "GAME_OVER_WIN";
                }
            }
        }
    }
    
    // Update Entities
    gameState.towers.forEach(t => t.update());
    gameState.enemies.forEach(e => e.update());
    gameState.projectiles.forEach(p => p.update());
    updateParticles();
    
    // Physics
    checkCollisions();
    
    // Logging (throttled)
    if (p.frameCount % 60 === 0) {
        p.logs.game_info.push({
            phase: gameState.gamePhase,
            entities: gameState.enemies.length + gameState.towers.length,
            fps: p.frameRate().toFixed(1)
        });
    }
}

function drawGame(p) {
    renderBackground(p);
    
    // Draw Entities (Order matters)
    gameState.towers.forEach(t => t.render(p));
    gameState.enemies.forEach(e => e.render(p));
    gameState.projectiles.forEach(pr => pr.render(p));
    renderParticles(p);
    
    renderUI(p);
}