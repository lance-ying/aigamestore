import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, logGameInfo } from './globals.js';
import { DungeonGenerator } from './map.js';
import { Player, Enemy, Item } from './entities.js';
import { movePlayer, waitTurn, usePotion } from './physics.js';
import { renderUI, renderStartScreen, renderGameOver } from './ui.js';
import { randomInt, gridToPixel, distEuclidean } from './utils.js';

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
        
        // Listen for level generation event
        window.addEventListener('GENERATE_LEVEL', () => {
            initLevel();
        });
        
        logGameInfo(p, { gamePhase: "START" });
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;

        // Automated Testing Handling - REMOVED
        // if (gameState.gamePhase === "PLAYING" && gameState.controlMode !== "HUMAN") {
        //     handleAutomatedInput();
        // }

        switch (gameState.gamePhase) {
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
                renderUI(p); // Show UI in pause (instructions hidden in renderUI)
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
    };

    p.keyPressed = function() {
        // Input logging
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });

        if (gameState.gamePhase === "START") {
            if (p.keyCode === p.ENTER) {
                startGame();
            } else if (p.keyCode === p.LEFT_ARROW) {
                gameState.selectedClassIndex = (gameState.selectedClassIndex - 1 + gameState.availableClasses.length) % gameState.availableClasses.length;
            } else if (p.keyCode === p.RIGHT_ARROW) {
                gameState.selectedClassIndex = (gameState.selectedClassIndex + 1) % gameState.availableClasses.length;
            }
        } else if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
            if (p.keyCode === p.UP_ARROW) movePlayer(0, -1);
            else if (p.keyCode === p.DOWN_ARROW) movePlayer(0, 1);
            else if (p.keyCode === p.LEFT_ARROW) movePlayer(-1, 0);
            else if (p.keyCode === p.RIGHT_ARROW) movePlayer(1, 0);
            else if (p.key === ' ' || p.keyCode === 32) waitTurn(); // Space to wait/interact
            else if (p.key === 'z' || p.key === 'Z') usePotion();
            else if (p.keyCode === 27) gameState.gamePhase = "PAUSED"; // ESC
        } else if (gameState.gamePhase === "PAUSED") {
            if (p.keyCode === 27) gameState.gamePhase = "PLAYING";
        } else if (gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "GAME_OVER_WIN") {
            if (p.key === 'r' || p.key === 'R') {
                gameState.gamePhase = "START";
                gameState.level = 1;
                gameState.score = 0;
            }
        }
    };
    
    function startGame() {
        gameState.gamePhase = "PLAYING";
        gameState.level = 1;
        gameState.score = 0;
        
        // Init player
        const classData = gameState.availableClasses[gameState.selectedClassIndex];
        // Temp pos, fixed in initLevel
        gameState.player = new Player(0, 0, classData);
        
        initLevel();
        
        logGameInfo(p, { gamePhase: "PLAYING", class: classData.name });
    }
    
    function initLevel() {
        const gen = DungeonGenerator.generate(gameState.level);
        gameState.map = gen.map;
        gameState.rooms = gen.rooms;
        
        // Place Player in first room
        const startRoom = gameState.rooms[0];
        gameState.player.gridX = startRoom.cx;
        gameState.player.gridY = startRoom.cy;
        gameState.player.visualX = gameState.player.gridX * TILE_SIZE;
        gameState.player.visualY = gameState.player.gridY * TILE_SIZE;
        
        // Spawn Enemies and Loot
        gameState.entities = [gameState.player]; // Reset entities list
        
        // Skip first room for enemies
        for (let i = 1; i < gameState.rooms.length; i++) {
            const r = gameState.rooms[i];
            const area = r.w * r.h;
            
            // Randomly spawn enemies
            const enemyCount = randomInt(1, Math.max(1, Math.floor(area / 15)));
            for (let j=0; j<enemyCount; j++) {
                const ex = randomInt(r.x, r.x + r.w - 1);
                const ey = randomInt(r.y, r.y + r.h - 1);
                
                // Don't spawn on top of each other
                let occupied = gameState.entities.some(e => e.gridX === ex && e.gridY === ey);
                if (!occupied && gameState.map[ey][ex].type !== 'STAIRS') {
                    const type = Math.random() < 0.5 ? 'Slime' : (Math.random() < 0.8 ? 'Goblin' : 'Skeleton');
                    gameState.entities.push(new Enemy(ex, ey, type, gameState.level));
                }
            }
            
            // Randomly spawn loot
            if (Math.random() < 0.4) {
                const lx = randomInt(r.x, r.x + r.w - 1);
                const ly = randomInt(r.y, r.y + r.h - 1);
                let occupied = gameState.entities.some(e => e.gridX === lx && e.gridY === ly);
                if (!occupied && gameState.map[ly][lx].type !== 'STAIRS') {
                    gameState.entities.push(new Item(lx, ly, Math.random() < 0.3 ? 'POTION' : 'GOLD'));
                }
            }
        }
        
        // Initial visibility
        updateVisibilityFallback();
    }
    
    function updateGame(p) {
        // Update Camera
        if (gameState.player) {
            gameState.player.updateVisuals();
            
            // Camera follow player with lerp
            const targetCamX = gameState.player.visualX - CANVAS_WIDTH / 2 + TILE_SIZE/2;
            const targetCamY = gameState.player.visualY - CANVAS_HEIGHT / 2 + TILE_SIZE/2;
            
            gameState.cameraX += (targetCamX - gameState.cameraX) * 0.1;
            gameState.cameraY += (targetCamY - gameState.cameraY) * 0.1;
            
            // Shake decay
            if (gameState.shake > 0) {
                gameState.shake *= 0.9;
                if (gameState.shake < 0.5) gameState.shake = 0;
            }
        }
        
        // Update visual positions of all entities
        gameState.entities.forEach(e => {
            if (e !== gameState.player) e.updateVisuals();
        });
        
        // Update particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            gameState.particles[i].update();
            if (gameState.particles[i].life <= 0) gameState.particles.splice(i, 1);
        }
        
        // Update Floating text
        for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
            gameState.floatingTexts[i].update();
            if (gameState.floatingTexts[i].lifetime <= 0) gameState.floatingTexts.splice(i, 1);
        }
        
        // Log player info periodically
        if (p.frameCount % 60 === 0 && gameState.player) {
            p.logs.player_info.push({
                x: gameState.player.gridX,
                y: gameState.player.gridY,
                hp: gameState.player.hp,
                score: gameState.score,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }
    
    function renderGame(p) {
        p.background(COLORS.BACKGROUND);
        
        p.push();
        // Apply Camera and Shake
        let shakeX = (Math.random() - 0.5) * gameState.shake;
        let shakeY = (Math.random() - 0.5) * gameState.shake;
        p.translate(-gameState.cameraX + shakeX, -gameState.cameraY + shakeY);
        
        // Render Map
        // Optimize: only render visible tiles within camera
        const startCol = Math.floor(gameState.cameraX / TILE_SIZE);
        const endCol = startCol + (CANVAS_WIDTH / TILE_SIZE) + 1;
        const startRow = Math.floor(gameState.cameraY / TILE_SIZE);
        const endRow = startRow + (CANVAS_HEIGHT / TILE_SIZE) + 1;

        for (let y = Math.max(0, startRow); y < Math.min(gameState.map.length, endRow); y++) {
            for (let x = Math.max(0, startCol); x < Math.min(gameState.map[0].length, endCol); x++) {
                const tile = gameState.map[y][x];
                if (tile.visible) {
                    if (tile.type === 'WALL') {
                        p.fill(COLORS.WALL);
                        p.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        p.fill(COLORS.WALL_TOP); // highlight
                        p.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, 4);
                    } else if (tile.type === 'FLOOR') {
                        p.fill(COLORS.FLOOR_VISIBLE);
                        p.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    } else if (tile.type === 'STAIRS') {
                        p.fill(COLORS.FLOOR_VISIBLE);
                        p.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        p.fill(COLORS.STAIRS);
                        p.rect(x * TILE_SIZE + 4, y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                    }
                } else if (tile.seen) {
                    // Fog of war
                    if (tile.type === 'WALL') {
                        p.fill(30);
                        p.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    } else {
                        p.fill(20);
                        p.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        if (tile.type === 'STAIRS') {
                            p.fill(0, 100, 100);
                            p.rect(x * TILE_SIZE + 8, y * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
                        }
                    }
                }
            }
        }
        
        // Render Entities
        gameState.entities.forEach(ent => {
            // Only render if on visible tile
            if (gameState.map[ent.gridY][ent.gridX].visible || ent instanceof Item && gameState.map[ent.gridY][ent.gridX].seen) {
                ent.render(p, 0, 0); // Camera translation handled by push/pop
            }
        });
        
        // Render Particles
        gameState.particles.forEach(pt => pt.render(p, 0, 0));
        
        // Render Floating Text
        gameState.floatingTexts.forEach(ft => ft.render(p, 0, 0));
        
        p.pop();
    }
    
    // Duplicate fallback for visibility init
    function updateVisibilityFallback() {
        const VIEW_RADIUS = 7;
        const px = gameState.player.gridX;
        const py = gameState.player.gridY;
        
        for (let y = py - VIEW_RADIUS; y <= py + VIEW_RADIUS; y++) {
            for (let x = px - VIEW_RADIUS; x <= px + VIEW_RADIUS; x++) {
                if (x >= 0 && x < gameState.map[0].length && y >= 0 && y < gameState.map.length) {
                    if (Math.abs(x - px) + Math.abs(y - py) <= VIEW_RADIUS) {
                        gameState.map[y][x].visible = true;
                        gameState.map[y][x].seen = true;
                    }
                }
            }
        }
    }
});

window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode Set:", mode);
    // Restart if needed for clean state
    if (gameState.gamePhase !== "START") {
        gameState.gamePhase = "START";
    }
};