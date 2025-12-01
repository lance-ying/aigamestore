import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, HOOP_SPAWN_INTERVAL, HOOP_GAP_HEIGHT } from './globals.js';
import { Player, Hoop } from './entities.js';
import { checkHoopCollisions, checkScore, checkWorldBounds } from './physics.js';
import { handleKeyPress, handleKeyRelease } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPausedOverlay } from './ui.js';
import { Particle, createExplosion } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Initial logs setup
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
        
        // Log start
        p.logs.game_info.push({
            event: "INITIALIZED",
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        
        // Background
        drawBackground(p);
        
        // Handle Automated Inputs
        if (gameState.controlMode.startsWith("TEST") && gameState.gamePhase === "PLAYING") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                p.keyCode = action.keyCode;
                handleKeyPress(p);
                p.keyCode = 0; // Reset
            }
        }

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
                renderPausedOverlay(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };
    
    p.keyReleased = function() {
        handleKeyRelease(p);
    }
});

function drawBackground(p) {
    // Dynamic background based on score
    const c1 = p.color(20, 20, 40);
    const c2 = p.color(50, 40, 80);
    
    // Simple gradient
    p.noFill();
    for(let y = 0; y < CANVAS_HEIGHT; y+=10) {
        let inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
        let c = p.lerpColor(c1, c2, inter);
        p.fill(c);
        p.noStroke();
        p.rect(0, y, CANVAS_WIDTH, 10);
    }

    // Screen shake application
    if (gameState.shakeIntensity > 0) {
        p.translate(p.random(-gameState.shakeIntensity, gameState.shakeIntensity), 
                    p.random(-gameState.shakeIntensity, gameState.shakeIntensity));
        gameState.shakeIntensity *= 0.9; // Decay
        if (gameState.shakeIntensity < 0.5) gameState.shakeIntensity = 0;
    }
}

function updateGame(p) {
    // Spawn Player if needed
    if (!gameState.player) {
        gameState.player = new Player(150, CANVAS_HEIGHT / 2);
    }

    // Spawn Hoops
    if (p.frameCount % HOOP_SPAWN_INTERVAL === 0) {
        // Random height
        const margin = 100;
        const y = p.random(margin, CANVAS_HEIGHT - margin);
        gameState.hoops.push(new Hoop(CANVAS_WIDTH + 50, y));
    }

    // Update Player
    gameState.player.update(p);

    // World Bounds Check
    if (checkWorldBounds(gameState.player)) {
        gameOver();
        return;
    }

    // Update Hoops and Check Collisions
    for (let i = gameState.hoops.length - 1; i >= 0; i--) {
        const hoop = gameState.hoops[i];
        hoop.update(p);

        // Physics Collision
        if (checkHoopCollisions(gameState.player, hoop, p)) {
            // Just bounced
        }

        // Score Check
        const scoreResult = checkScore(gameState.player, hoop);
        if (scoreResult !== "NONE") {
            // Update Score
            const points = scoreResult === "SWISH" ? 2 : 1;
            gameState.score += points;
            gameState.hoopsPassed++;
            
            // Visual feedback
            gameState.shakeIntensity = scoreResult === "SWISH" ? 10 : 5;
            createExplosion(hoop.x, hoop.y, 20, 'CONFETTI', gameState);
            if (scoreResult === "SWISH") {
                createExplosion(hoop.x, hoop.y, 10, 'FLAME', gameState);
            }
        }

        // Missed Hoop Check (if passed without scoring)
        // Usually Flappy Dunk is generous: you can miss a hoop but if you hit the ground you die.
        // However, standard runner logic implies you MUST score.
        // Let's adopt the rule: If you pass the hoop's X and didn't score, 
        // you only lose if you hit the ground. But passing a hoop without scoring is fine 
        // as long as you don't hit the ground? No, usually that breaks the "chain".
        // Let's simply enforce: If hoop goes off screen and !scored, Game Over?
        // To be simpler and less frustrating: Game Over only on crash (rim/ground).
        // BUT, to force gameplay: If the hoop is completely passed (x < player.x - radius) and not scored, Game Over.
        if (!hoop.scored && hoop.x < gameState.player.x - gameState.player.radius - hoop.width/2 - 20) {
             gameOver();
             return;
        }

        // Remove off-screen hoops
        if (hoop.isOffScreen()) {
            gameState.hoops.splice(i, 1);
        }
    }

    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        gameState.particles[i].update();
        if (gameState.particles[i].isDead()) {
            gameState.particles.splice(i, 1);
        }
    }
}

function gameOver() {
    gameState.gamePhase = "GAME_OVER_LOSE";
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
    }
    
    // Final log
    if (window.gameInstance && window.gameInstance.logs) {
         window.gameInstance.logs.game_info.push({
            event: "GAME_OVER",
            score: gameState.score,
            timestamp: Date.now()
        });
    }
}

function renderGame(p) {
    // Render Hoops (Back part)
    gameState.hoops.forEach(hoop => hoop.renderBack(p));

    // Render Player
    if (gameState.player) {
        gameState.player.render(p);
    }

    // Render Hoops (Front part)
    gameState.hoops.forEach(hoop => hoop.renderFront(p));

    // Render Particles
    gameState.particles.forEach(pt => pt.render(p));
}

window.gameInstance = gameInstance;