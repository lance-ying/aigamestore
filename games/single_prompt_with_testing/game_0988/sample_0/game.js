/**
 * game.js
 * Main entry point. Sets up p5 instance, game loop, and system orchestration.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, COLORS, getGameState } from './globals.js';
import { Player, Slime, Bat, Boss } from './entities.js';
import { renderUI, renderStartScreen, renderGameOver, renderPauseScreen } from './ui.js';
import { handleKeyDown, handleKeyUp } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';
import { randomInt } from './utils.js';

// Get p5 from global (loaded via script)
const p5 = window.p5;

export const gameInstance = new p5((p) => {
    
    // Initialize Logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Expose reset function globally for input.js to call
        window.resetGameInstance = resetGame;
        
        // Initial Reset
        resetGame();
        
        // Log start
        p.logs.game_info.push({
            event: "setup_complete",
            timestamp: Date.now()
        });
    };

    function resetGame() {
        gameState.gamePhase = "START";
        gameState.score = 0;
        gameState.level = 1;
        gameState.wave = 1;
        gameState.killCount = 0;
        gameState.entities = [];
        gameState.particles = [];
        gameState.floatingTexts = [];
        gameState.spawnTimer = 0;
        gameState.bossActive = false;
        gameState.cameraShake = 0;

        // Create Player
        gameState.player = new Player();
        gameState.entities.push(gameState.player);
    }

    p.draw = function() {
        // Time management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // Automated Testing Input Injection
        const autoAction = get_automated_testing_action();
        if (autoAction) {
            // Simulate key press for one frame
            gameState.keys[autoAction.keyCode] = true;
            // Note: In a real system we'd need to clear this if it's not held, 
            // but for simple AI 'holding' the key by returning it every frame works.
            // We should clear keys that AREN'T returned if we want pure AI control, 
            // but mixing with input.js is fine for this scope.
        }

        // --- RENDER START ---
        
        // Camera Shake effect
        p.push();
        if (gameState.cameraShake > 0) {
            const sx = p.random(-gameState.cameraShake, gameState.cameraShake);
            const sy = p.random(-gameState.cameraShake, gameState.cameraShake);
            p.translate(sx, sy);
            gameState.cameraShake *= 0.9;
            if (gameState.cameraShake < 0.5) gameState.cameraShake = 0;
        }

        drawBackground(p);

        // State Machine
        switch (gameState.gamePhase) {
            case "START":
                renderGameWorld(p);
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGameLogic(p);
                renderGameWorld(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGameWorld(p);
                renderUI(p);
                renderPauseScreen(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGameWorld(p); // Static world behind
                renderUI(p);
                renderGameOver(p, gameState.gamePhase === "GAME_OVER_WIN");
                break;
        }
        
        p.pop(); // End Camera Shake

        // Logging Player Info
        if (gameState.player && p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                hp: gameState.player.hp,
                score: gameState.score,
                frame: p.frameCount
            });
        }
    };

    function updateGameLogic(p) {
        // Spawn Enemies
        handleSpawning(p);

        // Update Entities
        // Reverse loop for safe removal
        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            const ent = gameState.entities[i];
            ent.update(p);
            
            // Remove dead entities that aren't player
            if (ent.dead && ent !== gameState.player) {
                gameState.entities.splice(i, 1);
            }
        }
        
        // Update Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const part = gameState.particles[i];
            part.update();
            if (part.life <= 0) gameState.particles.splice(i, 1);
        }
        
        // Update Floating Text
        for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
            const txt = gameState.floatingTexts[i];
            txt.update();
            if (txt.life <= 0) gameState.floatingTexts.splice(i, 1);
        }
    }

    function handleSpawning(p) {
        if (gameState.bossActive) {
            // Check if boss dead
            if (!gameState.entities.some(e => e instanceof Boss)) {
                gameState.bossActive = false;
                gameState.spawnTimer = 0;
                // Reward?
            }
            return; // Don't spawn small mobs during boss? Or spawn fewer?
        }

        gameState.spawnTimer++;
        
        // Difficulty curve: Spawn faster as level increases
        const spawnRate = Math.max(20, 100 - (gameState.level * 5));
        
        if (gameState.spawnTimer > spawnRate) {
            gameState.spawnTimer = 0;
            
            // Decide side
            const spawnX = Math.random() < 0.5 ? -50 : CANVAS_WIDTH + 50;
            const spawnY = GROUND_Y - 40;
            
            // Random enemy type based on level
            const rand = Math.random();
            let enemy;
            
            if (rand < 0.3 + (gameState.level * 0.05)) {
                // Bat (Flyer)
                enemy = new Bat(spawnX, randomInt(100, 300));
            } else {
                // Slime (Ground)
                enemy = new Slime(spawnX, spawnY);
            }
            
            gameState.entities.push(enemy);
        }
        
        // Boss Spawn Condition
        if (gameState.killCount > 0 && gameState.killCount % 20 === 0 && !gameState.bossActive) {
             // Delay to not spam bosses if killCount sits at 20 (need a 'bossSpawned' flag per threshold)
             // Simplified: just check if boss exists
             gameState.bossActive = true;
             gameState.entities.push(new Boss(CANVAS_WIDTH/2, -100)); // Drop from sky
             p.logs.game_info.push({ event: "BOSS_SPAWNED", frame: p.frameCount });
        }
    }

    function drawBackground(p) {
        p.background(COLORS.background);
        
        // Draw Moon
        p.fill(240, 240, 200);
        p.circle(500, 80, 60);
        
        // Draw Mountains (Parallax could go here)
        p.fill(30, 30, 45);
        p.beginShape();
        p.vertex(0, CANVAS_HEIGHT);
        p.vertex(0, 200);
        p.vertex(100, 150);
        p.vertex(200, 220);
        p.vertex(300, 120);
        p.vertex(450, 250);
        p.vertex(600, 180);
        p.vertex(600, CANVAS_HEIGHT);
        p.endShape(p.CLOSE);
    }

    function renderGameWorld(p) {
        // Draw Ground
        p.fill(COLORS.ground);
        p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
        p.fill(COLORS.groundTop);
        p.rect(0, GROUND_Y, CANVAS_WIDTH, 10);
        
        // Render Entities
        // Sort by Y so lower entities are in front
        const sortedEntities = [...gameState.entities].sort((a, b) => (a.y + a.height) - (b.y + b.height));
        
        sortedEntities.forEach(ent => ent.render(p));
        
        // Render Particles
        gameState.particles.forEach(part => part.render(p));
        
        // Render Text
        gameState.floatingTexts.forEach(txt => txt.render(p));
    }

    p.keyPressed = function() {
        handleKeyDown(p);
    };

    p.keyReleased = function() {
        handleKeyUp(p);
    };
});

// Expose instance
window.gameInstance = gameInstance;