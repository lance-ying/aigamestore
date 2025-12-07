import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';
import { Player, Enemy, Projectile, Collectible, Block } from './entities.js';
import { resolveMapCollisions, applyGravity, checkAABB } from './physics.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { generateLevel } from './level.js';
import { renderUI, renderStartScreen, renderPauseScreen, renderGameOver } from './ui.js';
import { updateParticles, renderParticles } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        gameState.gamePhase = "START";
        
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        
        // Automated inputs
        get_automated_testing_action();
        
        p.background(135, 206, 235); // Sky Blue
        
        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        } else if (gameState.gamePhase === "PLAYING") {
            updateGame(p);
            renderGame(p);
            renderUI(p);
        } else if (gameState.gamePhase === "PAUSED") {
            renderGame(p);
            renderUI(p);
            renderPauseScreen(p);
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            renderGame(p);
            renderUI(p);
            renderGameOver(p);
        }
    };
    
    function updateGame(p) {
        if (!gameState.player) return;
        
        // Player Input Movement
        if (gameState.keys[37]) gameState.player.moveLeft = true; // Left
        else gameState.player.moveLeft = false;
        
        if (gameState.keys[39]) gameState.player.moveRight = true; // Right
        else gameState.player.moveRight = false;
        
        let dir = 0;
        if (gameState.player.moveLeft) dir = -1;
        if (gameState.player.moveRight) dir = 1;
        
        // Acceleration
        if (dir !== 0) {
            let speed = gameState.keys[16] ? gameState.player.speed * 1.5 : gameState.player.speed; // Shift to sprint
            gameState.player.vx += dir * 0.5;
            if (gameState.player.vx > speed) gameState.player.vx = speed;
            if (gameState.player.vx < -speed) gameState.player.vx = -speed;
        }

        // Camera Logic
        gameState.camera.x = p.lerp(gameState.camera.x, gameState.player.x - CANVAS_WIDTH/2, 0.1);
        gameState.camera.x = p.constrain(gameState.camera.x, 0, WORLD_WIDTH - CANVAS_WIDTH);
        
        // Update Entities
        let blocks = gameState.levelData ? gameState.levelData.blocks : [];
        
        // Player Physics
        applyGravity(gameState.player);
        resolveMapCollisions(gameState.player, blocks);
        gameState.player.update(p);
        
        // Check win condition (Reach end)
        if (gameState.player.x > WORLD_WIDTH - 100) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
        
        // Update other entities
        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            let entity = gameState.entities[i];
            
            if (entity === gameState.player) continue;
            
            // Physics for dynamic entities
            if (entity.type === 'enemy') {
                // Simple collision with walls for enemies handled in their class or here
                // For now, basic movement
            }
            
            entity.update(p);
            
            // Interaction with Player
            if (entity.type === 'collectible') {
                if (checkAABB(gameState.player, entity)) {
                    entity.collect();
                }
            } else if (entity.type === 'enemy') {
                if (checkAABB(gameState.player, entity) && !entity.markedForDeletion) {
                    // Jump on head?
                    if (gameState.player.vy > 0 && gameState.player.y < entity.y) {
                        entity.die();
                        gameState.player.vy = -5; // Bounce
                    } else {
                        gameState.player.takeDamage(1);
                    }
                }
            } else if (entity.type === 'projectile') {
                // Collide with enemies
                 for (let j = 0; j < gameState.entities.length; j++) {
                     let other = gameState.entities[j];
                     if (other.type === 'enemy' && !other.markedForDeletion) {
                         if (checkAABB(entity, other)) {
                             other.die();
                             entity.markedForDeletion = true;
                             break;
                         }
                     }
                 }
            }
            
            if (entity.markedForDeletion) {
                gameState.entities.splice(i, 1);
            }
        }
        
        updateParticles();
        
        // Logging
        if (p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                hp: gameState.player.health,
                score: gameState.score,
                frame: p.frameCount
            });
        }
    }
    
    function renderGame(p) {
        // Draw World Background
        p.noStroke();
        // Distant mountains (parallax fake)
        p.fill(100, 150, 200);
        p.triangle(100 - gameState.camera.x * 0.2, 400, 300 - gameState.camera.x * 0.2, 100, 500 - gameState.camera.x * 0.2, 400);
        p.triangle(400 - gameState.camera.x * 0.2, 400, 600 - gameState.camera.x * 0.2, 150, 800 - gameState.camera.x * 0.2, 400);
        
        // Draw Rainbow at end
        let endX = WORLD_WIDTH - 150 - gameState.camera.x;
        if (endX < CANVAS_WIDTH) {
            p.push();
            p.noFill();
            p.strokeWeight(10);
            const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
            for(let i=0; i<colors.length; i++) {
                p.stroke(colors[i]);
                p.arc(endX + 100, 350, 200 - i*20, 200 - i*20, p.PI, 0);
            }
            p.pop();
            
            // Pot of gold
            p.fill(50);
            p.rect(endX + 60, 320, 80, 60);
            p.fill(255, 215, 0);
            p.circle(endX + 100, 320, 40);
        }

        // Render Blocks
        if (gameState.levelData) {
            gameState.levelData.blocks.forEach(block => block.render(p, gameState.camera.x, gameState.camera.y));
        }
        
        // Render Entities
        // Sort by type z-index? usually needed, but array order is ok for now. 
        // Ensure player is last or use z-index.
        gameState.entities.forEach(entity => {
            if (entity !== gameState.player) entity.render(p, gameState.camera.x, gameState.camera.y);
        });
        
        if (gameState.player) gameState.player.render(p, gameState.camera.x, gameState.camera.y);
        
        renderParticles(p, gameState.camera.x, gameState.camera.y);
    }

    p.keyPressed = function() {
        // Handle Restart globally
        if (p.keyCode === 82) { // R
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                startNewGame();
                gameState.gamePhase = "START";
                return;
            }
        }
        
        // Trigger Start from Start Screen
        if (p.keyCode === 13 && gameState.gamePhase === "START") {
            startNewGame();
            gameState.gamePhase = "PLAYING";
        }
        
        handleKeyPressed(p);
    };

    p.keyReleased = function() {
        handleKeyReleased(p);
    };
    
    function startNewGame() {
        generateLevel();
        gameState.score = 0;
        gameState.camera.x = 0;
        gameState.camera.y = 0;
    }
});

window.gameInstance = gameInstance;