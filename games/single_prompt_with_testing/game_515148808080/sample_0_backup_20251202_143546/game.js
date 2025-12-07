/**
 * game.js
 * Main game loop and entry point.
 */

import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, FPS, gameState, COLORS, logGameEvent 
} from './globals.js';
import { Player, Enemy, Collectible } from './entities.js';
import { generateRoom, spawnEntitiesForRoom } from './level_gen.js';
import { handleInput } from './input.js';
import { renderUI } from './ui.js';
import { checkEntityCollision } from './physics.js';
import { updateAndRenderParticles, spawnParticles } from './particle_system.js';
import { getAutomatedAction } from './automated_test.js';
import { clamp } from './math_utils.js';

const p5 = window.p5;

const gameInstance = new p5(p => {
    
    // Initialize Logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        let cvs = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        cvs.id('gameCanvas');
        p.frameRate(FPS);
        p.randomSeed(42);
        
        handleInput(p); // Setup listeners
        
        // Log start
        logGameEvent(p, 'game', { phase: 'SETUP' });
    };

    p.draw = function() {
        // 1. Time Management
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // 2. Automated Testing Input Override
        if (gameState.controlMode !== 'HUMAN') {
            getAutomatedAction(p);
            // Handle phase transitions for tests
            if (gameState.gamePhase === 'START' && gameState.controlMode.includes('TEST')) {
                 gameState.keys[13] = true; // Force Enter
                 if (p.frameCount % 10 === 0) p.keyPressed(); // Simulate press
            }
            if ((gameState.gamePhase === 'GAME_OVER_LOSE' || gameState.gamePhase === 'GAME_OVER_WIN') && gameState.controlMode.includes('TEST')) {
                gameState.keys[82] = true; // Force R
                if (p.frameCount % 10 === 0) p.keyPressed();
            }
        }

        // 3. Game State Logic
        if (gameState.needsReset) {
            initLevel(p, 0);
            gameState.needsReset = false;
        }

        // 4. Rendering & Update Loop
        p.background(COLORS.BACKGROUND);

        switch (gameState.gamePhase) {
            case 'START':
                // Optional: Render a demo background or attract mode here
                renderUI(p);
                break;

            case 'PLAYING':
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;

            case 'PAUSED':
                renderGame(p); // Draw game frozen behind overlay
                renderUI(p);
                break;

            case 'GAME_OVER_WIN':
            case 'GAME_OVER_LOSE':
                renderGame(p);
                renderUI(p);
                break;
        }
    };

    function initLevel(p, difficulty) {
        gameState.currentRoom = generateRoom(difficulty);
        gameState.entities = [];
        gameState.particles = [];
        
        // Spawn Player
        if (!gameState.player) {
            gameState.player = new Player(gameState.currentRoom.spawnPoint.x, gameState.currentRoom.spawnPoint.y);
        } else {
            // Carry over player state but reset pos
            gameState.player.x = gameState.currentRoom.spawnPoint.x;
            gameState.player.y = gameState.currentRoom.spawnPoint.y;
            gameState.player.vx = 0;
            gameState.player.vy = 0;
        }

        // Spawn Enemies and Items
        const spawns = spawnEntitiesForRoom(gameState.currentRoom, difficulty);
        spawns.forEach(spawn => {
            if (spawn.type === 'ENEMY') {
                gameState.entities.push(new Enemy(spawn.x, spawn.y, spawn.subtype));
            } else if (spawn.type === 'COIN') {
                gameState.entities.push(new Collectible(spawn.x, spawn.y));
            }
        });
        
        gameState.isTransitioning = false;
        gameState.transitionAlpha = 0;
    }

    function updateGame(p) {
        // 1. Room Transition
        if (gameState.isTransitioning) {
            gameState.transitionAlpha += 10;
            if (gameState.transitionAlpha >= 255) {
                // Load next level
                gameState.roomsCleared++;
                gameState.score += 100; // Room clear bonus
                initLevel(p, gameState.roomsCleared);
            }
            return; // Pause updates during fade out
        } else {
            if (gameState.transitionAlpha > 0) gameState.transitionAlpha -= 10;
        }

        // 2. Player Update
        if (gameState.player) {
            gameState.player.update(p);
            
            // Check Hazard Collision
            let map = gameState.currentRoom;
            // Check center point of player bottom
            let cx = Math.floor((gameState.player.x + gameState.player.w/2) / 40);
            let cy = Math.floor((gameState.player.y + gameState.player.h - 2) / 40);
            
            if (map.isHazard(cx, cy)) {
                gameState.player.die(p);
            }
        }

        // 3. Entities Update
        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            let ent = gameState.entities[i];
            ent.update(p);
            
            // Player Interaction
            if (checkEntityCollision(gameState.player, ent)) {
                if (ent.type === 'COIN') {
                    gameState.score += 50;
                    spawnParticles(ent.x + ent.w/2, ent.y + ent.h/2, 'COIN', 5);
                    gameState.entities.splice(i, 1);
                    logGameEvent(p, 'game', { event: 'coin_collected', total_score: gameState.score });
                } else if (ent.type === 'ENEMY') {
                    // Mario style stomp? Or just damage?
                    // Let's do simple stomp: if falling and above enemy
                    if (gameState.player.vy > 0 && gameState.player.y + gameState.player.h < ent.y + ent.h/2) {
                        gameState.player.vy = -8; // Bounce
                        spawnParticles(ent.x + ent.w/2, ent.y, 'EXPLOSION', 8);
                        gameState.score += 200;
                        gameState.entities.splice(i, 1);
                        logGameEvent(p, 'game', { event: 'enemy_stomped' });
                    } else if (gameState.player.invulnerable <= 0) {
                        gameState.player.die(p);
                    }
                }
            }
        }
    }

    function renderGame(p) {
        // Draw Room
        if (gameState.currentRoom) {
            gameState.currentRoom.render(p);
        }

        // Draw Entities
        gameState.entities.forEach(ent => ent.render(p));

        // Draw Player
        if (gameState.player) {
            gameState.player.render(p);
        }

        // Draw Particles
        updateAndRenderParticles(p);

        // Transition Overlay
        if (gameState.transitionAlpha > 0) {
            p.fill(0, 0, 0, gameState.transitionAlpha);
            p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
    }

}); // End p5 Instance

export default gameInstance;