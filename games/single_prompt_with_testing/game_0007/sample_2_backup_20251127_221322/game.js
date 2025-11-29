import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, getGameState } from './globals.js';
import { renderUI, renderStartScreen, renderGameOver, renderPauseScreen, renderFilmGrain, drawVintageBackground } from './ui.js';
import { setupInputHandlers, handleInput } from './input.js';
import { checkCollision } from './physics.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

// Global Game Instance
let gameInstance = new p5(p => {
    
    // Initialize Logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };
    
    // Add star helper for p5
    p.star = function(x, y, radius1, radius2, npoints) {
        let angle = p.TWO_PI / npoints;
        let halfAngle = angle / 2.0;
        p.beginShape();
        for (let a = 0; a < p.TWO_PI; a += angle) {
            let sx = x + p.cos(a) * radius2;
            let sy = y + p.sin(a) * radius2;
            p.vertex(sx, sy);
            sx = x + p.cos(a + halfAngle) * radius1;
            sy = y + p.sin(a + halfAngle) * radius1;
            p.vertex(sx, sy);
        }
        p.endShape(p.CLOSE);
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        gameState.gamePhase = "START";
        
        // Log start
        p.logs.game_info.push({
            event: "Game Initialized",
            timestamp: Date.now()
        });
        
        setupInputHandlers(p);
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        // Global screen shake effect
        p.push();
        if (gameState.screenShake > 0) {
            const rx = p.random(-gameState.screenShake, gameState.screenShake);
            const ry = p.random(-gameState.screenShake, gameState.screenShake);
            p.translate(rx, ry);
            gameState.screenShake *= 0.9; // Decay
            if (gameState.screenShake < 0.5) gameState.screenShake = 0;
        }
        
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
                renderGame(p); // Render underlying game frozen
                renderUI(p);
                renderPauseScreen(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderUI(p);
                renderGameOver(p, gameState.gamePhase === "GAME_OVER_WIN");
                break;
        }
        
        // Post-processing
        renderFilmGrain(p);
        
        p.pop(); // End Screen Shake
        
        // Logging Player info
        if (gameState.player && gameState.gamePhase === "PLAYING" && p.frameCount % 10 === 0) {
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                health: gameState.player.health,
                frame: p.frameCount
            });
        }
    };
});

function updateGame(p) {
    // Input
    handleInput(p);
    
    // Update Entities
    gameState.entities.forEach(e => e.update(p));
    
    // Projectiles
    gameState.projectiles.forEach(proj => proj.update(p));
    
    // Particles
    gameState.particles.forEach(part => part.update());
    
    // Collision Detection
    checkCollisions();
    
    // Cleanup
    gameState.entities = gameState.entities.filter(e => !e.markedForDeletion);
    gameState.projectiles = gameState.projectiles.filter(p => !p.markedForDeletion);
    gameState.particles = gameState.particles.filter(p => p.life > 0);
}

function checkCollisions() {
    const player = gameState.player;
    const boss = gameState.boss;
    
    if (!player || !boss) return;
    
    // Player vs Boss Body
    if (checkCollision(player, boss)) {
        if (player.invulnerable <= 0) {
            player.takeDamage(1);
            // Knockback
            player.vx = -10 * player.facing;
            player.vy = -5;
        }
    }
    
    // Projectiles
    gameState.projectiles.forEach(proj => {
        if (proj.markedForDeletion) return;
        
        if (proj.type === 'PLAYER') {
            // Hit Boss
            if (checkCollision(proj, boss)) {
                boss.takeDamage(proj.damage);
                proj.markedForDeletion = true;
                gameState.score += 10;
            }
        } else {
            // Hit Player
            if (checkCollision(proj, player)) {
                player.takeDamage(proj.damage);
                proj.markedForDeletion = true;
            }
        }
    });
}

function renderGame(p) {
    drawVintageBackground(p);
    
    // Draw Floor
    p.noStroke();
    p.fill(30, 20, 10);
    p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    // Grass/Top
    p.fill(40, 60, 30);
    p.rect(0, GROUND_Y, CANVAS_WIDTH, 10);
    
    // Render Order: Boss (Back), Player, Projectiles, Particles
    if (gameState.boss) gameState.boss.render(p);
    if (gameState.player) gameState.player.render(p);
    
    gameState.projectiles.forEach(proj => proj.render(p));
    gameState.particles.forEach(part => part.render(p));
}

// Window Globals for External Control
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    
    // Auto restart for testing convenience if in menu
    if (gameState.gamePhase === "START" && mode !== "HUMAN") {
        // Trigger start key manually or just set phase
        // Let's rely on user pressing Enter or implementing auto-start logic
        // But the constraint says "start on pressing ENTER". 
        // We will respect that. The Controller just overrides inputs when playing.
    }
};

window.gameInstance = gameInstance;