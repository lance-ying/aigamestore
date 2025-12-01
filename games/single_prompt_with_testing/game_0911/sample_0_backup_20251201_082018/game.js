import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, resetGameState, WORLD_WIDTH_TILES, TILE_SIZE, WORLD_HEIGHT_TILES } from './globals.js';
import { generateWorld, renderWorld } from './world.js';
import { Player, Enemy } from './entities.js';
import { handleInput, handleKeyPress } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
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
        
        // Initialize log
        p.logs.game_info.push({
            event: "INITIALIZATION",
            timestamp: Date.now()
        });
    };

    function initGame() {
        resetGameState();
        generateWorld(p);
        
        // Spawn Player above surface
        gameState.player = new Player(WORLD_WIDTH_TILES * TILE_SIZE / 2, 0);
        gameState.entities = [gameState.player];
        
        // Find surface Y for player
        let spawnY = 0;
        const centerCol = Math.floor(WORLD_WIDTH_TILES / 2);
        for(let y=0; y<WORLD_HEIGHT_TILES; y++) {
             if(gameState.worldMap[centerCol][y] !== 0) {
                 spawnY = (y - 2) * TILE_SIZE;
                 break;
             }
        }
        gameState.player.y = spawnY;
        
        // Spawn Initial Enemies
        for(let i=0; i<10; i++) {
            const ex = Math.random() * gameState.worldWidth;
            const ey = Math.random() * gameState.worldHeight / 2; // Upper half
            gameState.enemies.push(new Enemy(ex, ey));
        }
        
        gameState.gamePhase = "PLAYING";
    }

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;

        // Automated inputs
        if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                // Simulate Key Press for one frame
                if (action.keyCode) {
                     // Hack to inject input into p5 key state or handleInput directly
                     // Since p.keyIsDown checks hardware, we manually override handleInput logic for bots?
                     // Or better: update a virtual key map in gameState
                     gameState.keys[action.keyCode] = true;
                }
            }
        }

        // Sky Background (Gradient)
        // Lerp from light blue to black based on camera Y
        const depth = p.constrain(gameState.cameraY / (gameState.worldHeight - CANVAS_HEIGHT), 0, 1);
        const c1 = p.color(135, 206, 235); // Sky Blue
        const c2 = p.color(20, 20, 30);    // Cave Dark
        p.background(p.lerpColor(c1, c2, depth));

        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGameLogic();
                renderGameWorld();
                renderUI(p);
                break;
            case "PAUSED":
                renderGameWorld(); // Draw game behind overlay
                renderPaused(p);
                renderUI(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGameWorld();
                renderGameOver(p);
                renderUI(p);
                break;
        }
        
        // Clear simulated keys
        gameState.keys = {};
    };

    function updateGameLogic() {
        // Camera Follow
        if (gameState.player) {
            const targetX = gameState.player.x + gameState.player.width/2 - CANVAS_WIDTH/2;
            const targetY = gameState.player.y + gameState.player.height/2 - CANVAS_HEIGHT/2;
            gameState.cameraX = p.lerp(gameState.cameraX, targetX, 0.1);
            gameState.cameraY = p.lerp(gameState.cameraY, targetY, 0.1);
            
            // Constrain Camera
            gameState.cameraX = p.constrain(gameState.cameraX, 0, gameState.worldWidth - CANVAS_WIDTH);
            gameState.cameraY = p.constrain(gameState.cameraY, -200, gameState.worldHeight - CANVAS_HEIGHT + 50); // Allow seeing sky
        }
        
        // Handle Input (Standard + Bot)
        // Wrapper for keyIsDown that checks real keys OR virtual bot keys
        const customP = Object.create(p);
        customP.keyIsDown = (code) => {
            return p.keyIsDown(code) || gameState.keys[code];
        };
        
        handleInput(customP);
        
        // Update Entities
        gameState.player.update(p);
        
        gameState.enemies.forEach((enemy, i) => {
            enemy.update();
            if (enemy.dead) {
                gameState.enemies.splice(i, 1);
                // Respawn logic
                if (gameState.enemies.length < 15 && Math.random() < 0.05) {
                    const side = Math.random() > 0.5 ? 1 : 0;
                    const sx = gameState.cameraX + (side * CANVAS_WIDTH) + (side ? 100 : -100);
                    const sy = gameState.cameraY + Math.random() * CANVAS_HEIGHT;
                    gameState.enemies.push(new Enemy(p.constrain(sx, 0, gameState.worldWidth), p.constrain(sy, 0, gameState.worldHeight)));
                }
            }
        });
        
        gameState.items.forEach(item => item.update());
        
        // Update Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            gameState.particles[i].update();
            if (gameState.particles[i].life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
    }
    
    function renderGameWorld() {
        p.push();
        // Camera translation applied inside render methods via global camera vars? 
        // Or apply here?
        // Current implementation: Entities and Tiles subtract cameraX/Y manually.
        // This prevents floating point jitter on high coordinates if we just translated the canvas.
        
        renderWorld(p);
        
        gameState.items.forEach(item => item.render(p));
        gameState.enemies.forEach(enemy => enemy.render(p));
        
        if (gameState.player) gameState.player.render(p);
        
        gameState.particles.forEach(pt => pt.render(p));
        
        p.pop();
    }

    p.keyPressed = function() {
        // Global Phase Transitions
        if (p.keyCode === 13 && gameState.gamePhase === "START") {
            initGame();
        } else if (p.keyCode === 82 && gameState.gamePhase.startsWith("GAME_OVER")) { // R
            initGame();
        }
        
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        p.logs.inputs.push({
            key: p.key,
            keyCode: p.keyCode,
            type: "RELEASE",
            frameCount: p.frameCount
        });
    };
});

window.gameInstance = gameInstance;