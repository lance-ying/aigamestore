/**
 * Main Game Loop and Setup
 */
import { gameState, resetGameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, WORLD_HEIGHT, WORLD_WIDTH, GRAVITY } from './globals.js';
import { initInput, updateInputState } from './input.js';
import { Slugcat } from './entities.js';
import { loadLevel } from './level.js';
import { renderHUD, renderStartScreen, renderPauseScreen, renderGameOver } from './ui.js';

const p5 = window.p5;

const gameInstance = new p5(p => {
    
    // Initialize Logs
    p.logs = {
        game_info: [],
        inputs: [],
        player_info: []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initInput(p);
        
        // Log Start
        p.logs.game_info.push({
            event: "Game Initialized",
            timestamp: Date.now()
        });
    };

    function startNewGame() {
        resetGameState();
        
        // Load World
        loadLevel();
        
        // Create Player
        gameState.player = new Slugcat(100, WORLD_HEIGHT - 100);
        gameState.entities.push(gameState.player); // Add to render list
        
        gameState.gamePhase = "PLAYING";
        gameState.shouldReset = false;
    }

    p.draw = function() {
        const currentTime = Date.now();
        if (gameState.lastFrameTime === 0) gameState.lastFrameTime = currentTime;
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // Background
        p.background(COLORS.BACKGROUND);

        if (gameState.shouldReset) {
            startNewGame();
        }

        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;

            case "PLAYING":
                updateGameLogic(p);
                renderWorld(p);
                renderHUD(p);
                break;

            case "PAUSED":
                renderWorld(p); // Draw world static
                renderHUD(p);
                renderPauseScreen(p);
                break;

            case "GAME_OVER_WIN":
                renderWorld(p);
                renderGameOver(p, true);
                break;

            case "GAME_OVER_LOSE":
                renderWorld(p);
                renderGameOver(p, false);
                break;
        }
    };

    function updateGameLogic(p) {
        // Input
        updateInputState();

        // Rain Cycle
        gameState.rainTimer--;
        if (gameState.rainTimer <= 0) {
            // Rain death logic
            gameState.rainIntensity = 1;
            gameState.waterLevel -= 1; // Rise
            
            // Screen Shake
            const shake = Math.random() * 5;
            p.translate(shake, shake);
            
            // Kill player if caught
            if (gameState.player.y > gameState.waterLevel && !gameState.player.isDead) {
                gameState.player.die();
            }
        } else if (gameState.rainTimer < 1000) {
            // Darken/Warning
            gameState.rainIntensity = p.map(gameState.rainTimer, 1000, 0, 0, 1);
        }

        // Camera Follow
        if (gameState.player) {
            let targetX = gameState.player.x - CANVAS_WIDTH / 2;
            let targetY = gameState.player.y - CANVAS_HEIGHT / 2;
            
            // Constrain Camera to World
            targetX = p.constrain(targetX, 0, WORLD_WIDTH - CANVAS_WIDTH);
            targetY = p.constrain(targetY, 0, WORLD_HEIGHT - CANVAS_HEIGHT);
            
            // Smooth lerp
            gameState.camera.x = p.lerp(gameState.camera.x, targetX, 0.1);
            gameState.camera.y = p.lerp(gameState.camera.y, targetY, 0.1);
        }

        // Update Entities
        // We filter inactive ones periodically or splice them out. 
        // For simplicity in this loop, we iterate and skip inactive.
        gameState.entities.forEach(entity => {
            if (entity.active || entity.isStatic) {
                entity.update();
            }
        });

        // Update Particles
        for(let i = gameState.particles.length - 1; i >= 0; i--) {
            gameState.particles[i].update();
            if (!gameState.particles[i].active) {
                gameState.particles.splice(i, 1);
            }
        }

        // Logs
        if (gameState.frameCount % 10 === 0 && gameState.player) {
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                state: gameState.player.state,
                health: gameState.player.health,
                frame: gameState.frameCount
            });
        }
    }

    function renderWorld(p) {
        p.push();
        // Apply Camera Transform
        p.translate(-gameState.camera.x, -gameState.camera.y);

        // Draw Water/Pit
        if (gameState.waterLevel < WORLD_HEIGHT + 100) {
            p.fill(COLORS.RAIN + '88');
            p.rect(0, gameState.waterLevel, WORLD_WIDTH, WORLD_HEIGHT - gameState.waterLevel + 200);
        }

        // Render Order: Background Objects -> Platforms -> Items -> Enemies -> Player -> Foreground
        
        // 1. Poles
        gameState.poles.forEach(pole => pole.render(p));
        
        // 2. Platforms
        gameState.platforms.forEach(plat => plat.render(p));
        
        // 3. Items/Collectibles
        gameState.collectibles.forEach(c => c.render(p));
        gameState.items.forEach(i => i.render(p));
        
        // 4. Shelter
        if(gameState.shelter) gameState.shelter.render(p);

        // 5. Enemies
        gameState.enemies.forEach(e => e.render(p));
        
        // 6. Player
        if (gameState.player) gameState.player.render(p);
        
        // 7. Particles
        gameState.particles.forEach(part => part.render(p));

        // Rain Effect Overlay
        if (gameState.rainIntensity > 0) {
            p.stroke(COLORS.RAIN);
            p.strokeWeight(2);
            for(let i=0; i < 50 * gameState.rainIntensity; i++) {
                const rx = p.random(gameState.camera.x, gameState.camera.x + CANVAS_WIDTH);
                const ry = p.random(gameState.camera.y, gameState.camera.y + CANVAS_HEIGHT);
                p.line(rx, ry, rx - 2, ry + 10);
            }
        }

        p.pop();
    }
});

window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode Set to:", mode);
};