// game.js - Main Game Loop and Setup
import { gameState, initLogs, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, ENTITY_TYPES, ENEMY_TYPES } from './globals.js';
import { handleInput, KEYS } from './input.js';
import { Player, Enemy, Collectible, Tile } from './entities.js';
import { renderUI, renderStartScreen, renderGameOver, renderPausedOverlay } from './ui.js';
import { updateParticles, renderParticles } from './particles.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Initialize Logs
    initLogs(p);

    // ==========================================
    // Setup
    // ==========================================
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initial state log
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    // ==========================================
    // Game Initialization (Level Generation)
    // ==========================================
    function initGame() {
        resetGameState();
        
        // Level Generation
        // A simple pattern based level length
        const levelCols = 150; 
        const levelRows = Math.floor(CANVAS_HEIGHT / TILE_SIZE) + 1; // Extra row for safety
        
        gameState.levelWidth = levelCols * TILE_SIZE;
        gameState.levelHeight = CANVAS_HEIGHT;
        
        // Initialize 2D array
        for (let r = 0; r < levelRows; r++) {
            gameState.tiles[r] = new Array(levelCols).fill(null);
        }
        
        // Floor generation
        for (let c = 0; c < levelCols; c++) {
            // Ground at bottom 2 rows
            gameState.tiles[levelRows - 2][c] = new Tile('grass', c, levelRows - 2);
            gameState.tiles[levelRows - 1][c] = new Tile('dirt', c, levelRows - 1);
            
            // Pits (gaps in floor)
            if (c > 10 && c < levelCols - 10) {
                if ((c % 17 === 0) || (c % 23 === 0)) {
                    gameState.tiles[levelRows - 2][c] = null;
                    gameState.tiles[levelRows - 1][c] = null;
                }
            }
        }
        
        // Platforms and Obstacles
        for (let c = 10; c < levelCols - 10; c++) {
            let h = levelRows - 2;
            
            // Random platforms
            if (p.random() < 0.1) {
                const height = Math.floor(p.random(3, 6)); // height from bottom
                const width = Math.floor(p.random(2, 5));
                for (let w = 0; w < width; w++) {
                    if (c + w < levelCols) {
                        gameState.tiles[levelRows - height][c + w] = new Tile('brick', c + w, levelRows - height);
                        
                        // Chance for Lucky Block
                        if (p.random() < 0.3) {
                             gameState.tiles[levelRows - height - 3][c + w] = new Tile('lucky', c + w, levelRows - height - 3);
                        }
                    }
                }
            }
            
            // Pipes/Walls
            if (c % 30 === 15) {
                gameState.tiles[h-1][c] = new Tile('wall', c, h-1);
                gameState.tiles[h-2][c] = new Tile('wall', c, h-2);
            }
        }
        
        // Entities Spawning
        for (let c = 15; c < levelCols - 5; c += 10) {
            // Chance for enemies
            if (p.random() < 0.4 && !gameState.tiles[levelRows-2][c] === null) {
                const type = p.random() > 0.5 ? ENEMY_TYPES.SNAIL : ENEMY_TYPES.BEE;
                let y = (levelRows - 3) * TILE_SIZE;
                if (type === ENEMY_TYPES.BEE) y -= TILE_SIZE * 3;
                
                const enemy = new Enemy(c * TILE_SIZE, y, 30, 30, type);
                gameState.entities.push(enemy);
            }
            
            // Chance for coins
            if (p.random() < 0.5) {
                const coin = new Collectible(c * TILE_SIZE, (levelRows - 5) * TILE_SIZE, 'coin');
                gameState.entities.push(coin);
            }
        }
        
        // Spawn Player
        gameState.player = new Player(100, 200);
        gameState.entities.push(gameState.player);
        
        // End Goal (Rainbow pot logic implied by reaching X coord)
    }

    // ==========================================
    // Main Draw Loop
    // ==========================================
    p.draw = function() {
        // Timekeeping
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // Input
        handleInput(p);

        // State Machine
        switch(gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderPausedOverlay(p);
                renderUI(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
    };

    // ==========================================
    // Game Logic
    // ==========================================
    function updateGame(p) {
        // Update all entities
        // We iterate backwards to allow removal
        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            const ent = gameState.entities[i];
            
            // Optimization: Only update if within reasonable range of camera
            // (Keep projectiles always updating just in case)
            if (Math.abs(ent.x - gameState.cameraX) < CANVAS_WIDTH * 1.5 || ent.type === ENTITY_TYPES.PLAYER) {
                ent.update(p);
            }
            
            if (!ent.active) {
                gameState.entities.splice(i, 1);
            }
        }
        
        updateParticles(p);
        
        // Camera Follow Player
        if (gameState.player) {
            // Target X: Center player roughly
            let targetCamX = gameState.player.x - CANVAS_WIDTH * 0.4;
            
            // Clamp
            targetCamX = Math.max(0, Math.min(targetCamX, gameState.levelWidth - CANVAS_WIDTH));
            
            // Smooth lerp
            gameState.cameraX += (targetCamX - gameState.cameraX) * 0.1;
            gameState.cameraY = 0; // No vertical scrolling for this basic level
        }
        
        // Logging Player Info periodically
        if (p.frameCount % 10 === 0 && gameState.player) {
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

    // ==========================================
    // Rendering
    // ==========================================
    function renderGame(p) {
        // Background - Sky gradient
        p.noStroke();
        setSkyGradient(p);
        
        // Draw World (Tiles)
        renderWorld(p);
        
        // Draw Entities
        // Sort by type/z-index roughly? (Collectibles -> Enemies -> Player -> Foreground)
        gameState.entities.forEach(ent => {
             // Culling
             if (ent.x + ent.width > gameState.cameraX && ent.x < gameState.cameraX + CANVAS_WIDTH) {
                 ent.render(p, gameState.cameraX, gameState.cameraY);
             }
        });
        
        // Particles
        renderParticles(p, gameState.cameraX, gameState.cameraY);
    }
    
    function setSkyGradient(p) {
        // Simple manual gradient
        const c1 = p.color(100, 190, 255);
        const c2 = p.color(200, 230, 255);
        
        for (let y = 0; y < CANVAS_HEIGHT; y+=10) {
            const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
            const c = p.lerpColor(c1, c2, inter);
            p.fill(c);
            p.rect(0, y, CANVAS_WIDTH, 10);
        }
    }
    
    function renderWorld(p) {
        // Calculate visible tile range
        const startCol = Math.floor(gameState.cameraX / TILE_SIZE);
        const endCol = startCol + Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 1;
        
        for (let row = 0; row < gameState.tiles.length; row++) {
            for (let col = startCol; col <= endCol; col++) {
                if (col >= 0 && col < gameState.tiles[0].length) {
                    const tile = gameState.tiles[row][col];
                    if (tile) {
                        drawTile(p, tile, col * TILE_SIZE - gameState.cameraX, row * TILE_SIZE - gameState.cameraY);
                    }
                }
            }
        }
    }
    
    function drawTile(p, tile, x, y) {
        p.noStroke();
        if (tile.type === 'grass') {
            p.fill(34, 139, 34); // Forest Green
            p.rect(x, y, TILE_SIZE, TILE_SIZE);
            p.fill(139, 69, 19); // Dirt bits
            p.rect(x, y + 5, TILE_SIZE, TILE_SIZE - 5);
            // Grass top detail
            p.fill(50, 205, 50);
            p.rect(x, y, TILE_SIZE, 8);
        } else if (tile.type === 'dirt') {
            p.fill(139, 69, 19);
            p.rect(x, y, TILE_SIZE, TILE_SIZE);
            // Detail
            p.fill(120, 60, 15);
            p.circle(x + 10, y + 10, 5);
            p.circle(x + 30, y + 25, 8);
        } else if (tile.type === 'brick') {
            p.fill(178, 34, 34); // Firebrick
            p.rect(x, y, TILE_SIZE, TILE_SIZE);
            p.stroke(200, 100, 100);
            p.strokeWeight(2);
            p.line(x, y, x + TILE_SIZE, y);
            p.line(x, y + TILE_SIZE, x + TILE_SIZE, y + TILE_SIZE);
            p.line(x, y, x, y + TILE_SIZE);
            p.line(x + TILE_SIZE, y, x + TILE_SIZE, y + TILE_SIZE);
        } else if (tile.type === 'lucky') {
            if (tile.broken) {
                p.fill(100); // Dull grey
                p.rect(x, y, TILE_SIZE, TILE_SIZE);
            } else {
                p.fill(255, 215, 0); // Gold
                p.rect(x, y, TILE_SIZE, TILE_SIZE);
                p.fill(255);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(20);
                p.text("?", x + TILE_SIZE/2, y + TILE_SIZE/2);
            }
            p.stroke(0);
            p.strokeWeight(1);
            p.noFill();
            p.rect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (tile.type === 'wall') {
            p.fill(100);
            p.rect(x, y, TILE_SIZE, TILE_SIZE);
            p.fill(80);
            p.rect(x+5, y+5, TILE_SIZE-10, TILE_SIZE-10);
        }
    }

    // ==========================================
    // Event Listeners
    // ==========================================
    p.keyPressed = function() {
        // Track key
        gameState.keys[p.keyCode] = true;
        
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });

        // Phase Transitions
        if (p.keyCode === KEYS.ENTER && gameState.gamePhase === "START") {
            initGame();
            gameState.gamePhase = "PLAYING";
        } else if (p.keyCode === KEYS.ESC) {
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        } else if (p.keyCode === KEYS.R && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
            gameState.gamePhase = "START";
        }
    };

    p.keyReleased = function() {
        gameState.keys[p.keyCode] = false;
        
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };
});

window.gameInstance = gameInstance;