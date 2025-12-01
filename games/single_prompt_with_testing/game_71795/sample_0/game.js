import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { Player, Enemy, Collectible } from './entities.js';
import { handleKeyDown, handleKeyUp, getInput } from './input.js';
import { renderStartScreen, renderHUD, renderGameOver, renderPause } from './ui.js';
import { checkCircleCollision, randomRange } from './utils.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Logs initialization
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Initialize Player for Start screen visual
        resetGame();
        
        // Log start
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    function resetGame() {
        gameState.gamePhase = GAME_PHASES.START;
        gameState.player = new Player(CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        gameState.enemies = [];
        gameState.projectiles = [];
        gameState.collectibles = [];
        gameState.particles = [];
        gameState.floatingTexts = [];
        gameState.wave = 1;
        gameState.waveTimer = 0;
        gameState.score = 0;
        gameState.shakeTimer = 0;
    }

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;

        // Shake
        let shakeX = 0;
        let shakeY = 0;
        if (gameState.shakeTimer > 0) {
            shakeX = p.random(-gameState.shakeMagnitude, gameState.shakeMagnitude);
            shakeY = p.random(-gameState.shakeMagnitude, gameState.shakeMagnitude);
            gameState.shakeTimer--;
        }

        p.push();
        p.translate(shakeX, shakeY);
        p.background(30, 30, 35); // Dark gray bg
        
        // Draw grid
        p.stroke(40);
        p.strokeWeight(1);
        for(let i=0; i<CANVAS_WIDTH; i+=40) p.line(i, 0, i, CANVAS_HEIGHT);
        for(let i=0; i<CANVAS_HEIGHT; i+=40) p.line(0, i, CANVAS_WIDTH, i);

        // Phases
        if (gameState.gamePhase === GAME_PHASES.START) {
            if (gameState.player) gameState.player.render(p); // Just for show
            renderStartScreen(p);
        }
        else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
            updateGame(p);
            renderGame(p);
            renderHUD(p);
        }
        else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
            renderGame(p);
            renderHUD(p);
            renderPause(p);
        }
        else {
            renderGame(p);
            renderGameOver(p);
        }
        p.pop();
    };

    function updateGame(p) {
        // Wave Management
        gameState.waveTimer += gameState.deltaTime;
        
        // Spawning
        gameState.spawnTimer++;
        const currentRate = Math.max(20, 60 - (gameState.wave * 10)); // Faster spawning each wave
        
        if (gameState.spawnTimer >= currentRate) {
            gameState.spawnTimer = 0;
            spawnEnemy();
        }

        // Wave transition
        if (gameState.waveTimer >= gameState.waveDuration) {
            if (gameState.wave < gameState.maxWaves) {
                gameState.wave++;
                gameState.waveTimer = 0;
                gameState.waveDuration += 10; // Longer waves
                
                // Heal player a bit
                gameState.player.hp = Math.min(gameState.player.hp + 20, gameState.player.maxHp);
                
                // Spawn wave text
                gameState.floatingTexts.push({
                    x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2, 
                    text: `WAVE ${gameState.wave}`, 
                    color: [255, 255, 255], 
                    life: 120, vy: -0.5, 
                    update: function(){this.y+=this.vy; this.life--;}, 
                    render: function(p){p.textSize(32); p.fill(this.color); p.text(this.text, this.x, this.y);}
                });
            } else {
                gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
            }
        }

        // Input
        const input = getInput();
        
        // Update Player
        if (gameState.player) {
            // Apply input
            gameState.player.vx += input.x * gameState.player.speed * 0.2; // Acceleration
            gameState.player.vy += input.y * gameState.player.speed * 0.2;
            
            // Limit speed (simple)
            const maxSpd = gameState.player.speed;
            const spd = Math.sqrt(gameState.player.vx**2 + gameState.player.vy**2);
            if (spd > maxSpd) {
                gameState.player.vx = (gameState.player.vx / spd) * maxSpd;
                gameState.player.vy = (gameState.player.vy / spd) * maxSpd;
            }

            // Dash
            if (input.dash && gameState.player.stamina > 30 && gameState.player.dashCooldown <= 0) {
                gameState.player.isDashing = true;
                gameState.player.stamina -= 30;
                gameState.player.dashCooldown = 60;
                gameState.player.vx *= 3;
                gameState.player.vy *= 3;
            }
            
            gameState.player.update();
            
            // Player Log
            if (p.frameCount % 60 === 0) {
                p.logs.player_info.push({
                    hp: gameState.player.hp,
                    pos: {x: gameState.player.x, y: gameState.player.y},
                    frame: p.frameCount
                });
            }
        }

        // Entities Update
        gameState.projectiles.forEach((proj, i) => {
            proj.update();
            if (proj.life <= 0 || 
                proj.x < 0 || proj.x > CANVAS_WIDTH || 
                proj.y < 0 || proj.y > CANVAS_HEIGHT) {
                gameState.projectiles.splice(i, 1);
            }
            
            // Projectile vs Enemy
            gameState.enemies.forEach(enemy => {
                if (checkCircleCollision({x: proj.x, y: proj.y, radius: proj.radius}, enemy)) {
                    // Avoid multi-hit if penetration is low? 
                    // Simple check: if not in hitList
                    if (!proj.hitList.includes(enemy)) {
                        enemy.takeDamage(proj.damage, proj.vx, proj.vy);
                        proj.hitList.push(enemy);
                        proj.penetration--;
                        if (proj.penetration <= 0) proj.life = 0;
                    }
                }
            });
        });
        
        gameState.enemies.forEach(e => e.update());
        gameState.collectibles.forEach(c => c.update());
        gameState.particles.forEach((pt, i) => {
            pt.update();
            if (pt.life <= 0) gameState.particles.splice(i, 1);
        });
        gameState.floatingTexts.forEach((ft, i) => {
            ft.update();
            if (ft.life <= 0) gameState.floatingTexts.splice(i, 1);
        });

        // Player vs Enemy Collision
        if (!gameState.player.isDashing) {
            gameState.enemies.forEach(enemy => {
                if (checkCircleCollision(gameState.player, enemy)) {
                    gameState.player.takeDamage(1); // Drain HP contact
                    // Bounce back slightly
                    const angle = Math.atan2(gameState.player.y - enemy.y, gameState.player.x - enemy.x);
                    gameState.player.vx += Math.cos(angle) * 2;
                    gameState.player.vy += Math.sin(angle) * 2;
                }
            });
        }
    }

    function spawnEnemy() {
        const side = Math.floor(randomRange(0, 4));
        let x, y;
        const pad = 30;
        
        switch(side) {
            case 0: x = randomRange(0, CANVAS_WIDTH); y = -pad; break; // Top
            case 1: x = CANVAS_WIDTH + pad; y = randomRange(0, CANVAS_HEIGHT); break; // Right
            case 2: x = randomRange(0, CANVAS_WIDTH); y = CANVAS_HEIGHT + pad; break; // Bottom
            case 3: x = -pad; y = randomRange(0, CANVAS_HEIGHT); break; // Left
        }

        // Determine type based on wave
        let type = 'BASIC';
        const r = Math.random();
        if (gameState.wave > 1 && r < 0.2) type = 'SWARM';
        if (gameState.wave > 2 && r < 0.1) type = 'TANK';
        
        gameState.enemies.push(new Enemy(x, y, type));
    }

    function renderGame(p) {
        // Render order: Collectibles -> Enemies -> Player -> Projectiles -> Particles -> Text
        gameState.collectibles.forEach(c => c.render(p));
        gameState.enemies.forEach(e => e.render(p));
        if (gameState.player) gameState.player.render(p);
        gameState.projectiles.forEach(proj => proj.render(p));
        gameState.particles.forEach(pt => pt.render(p));
        gameState.floatingTexts.forEach(ft => ft.render(p));
    }

    p.keyPressed = function() {
        handleKeyDown(p);
    };

    p.keyReleased = function() {
        handleKeyUp(p);
    };
});

window.gameInstance = gameInstance;