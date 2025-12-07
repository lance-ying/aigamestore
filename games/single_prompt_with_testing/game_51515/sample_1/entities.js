/**
 * Game entities: Player, Enemies, Coins, Walls, Traps
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, PLAYER_SPEED, DASH_SPEED, WALL_OF_DOOM_SPEED } from './globals.js';
import { checkRectCollision, checkRectCircleCollision } from './physics.js';
import { isKeyPressed, getInputVector, KEY_SPACE, KEY_SHIFT } from './input.js';
import { createExplosion, createSparkle } from './particles.js';

class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.markedForDeletion = false;
    }

    update(p) {}
    render(p) {}
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20); // Smaller than tile for easier movement
        this.speed = PLAYER_SPEED;
        this.dashCooldown = 0;
        this.isDashing = false;
        this.invulnerable = 0;
        this.health = 1; // One hit kill mechanic usually, but let's allow shielding
    }

    update(p) {
        // Handle Cooldowns
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.invulnerable > 0) this.invulnerable--;
        if (this.isDashing) {
            // Dash logic implies continuing velocity
            this.speed = DASH_SPEED;
            if (this.dashCooldown < 45) { // Stop dashing after 15 frames (60 - 45)
                this.isDashing = false;
                this.speed = PLAYER_SPEED;
            }
        }

        // Input
        let input = { x: 0, y: 0 };
        
        // Automated vs Human input
        if (gameState.controlMode === "HUMAN") {
            input = getInputVector();
            
            // Dash
            if (isKeyPressed(KEY_SPACE) && this.dashCooldown === 0 && !this.isDashing) {
                this.isDashing = true;
                this.dashCooldown = 60; // 1 second cooldown
                // Particle effect for dash
                createExplosion(this.x + this.width/2, this.y + this.height/2, 5, [200, 200, 255]);
            }
            
            // Shield
            if (isKeyPressed(KEY_SHIFT) && gameState.score > 0) {
                this.invulnerable = 2; // Maintain invulnerability while held
                if (p.frameCount % 10 === 0) gameState.score = Math.max(0, gameState.score - 1); // Cost score
            }
        } else {
             // Handled via external injection or simple logic here if strictly needed, 
             // but we will use the test controller to simulate key presses in the input array 
             // or overwrite input vector here.
             // For this architecture, we rely on the test controller injecting key states into 'keys'.
             input = getInputVector();
        }
        
        // Physics Movement with Wall Collision
        
        // X Movement
        this.x += input.x * this.speed;
        // Collision X
        for (const wall of gameState.walls) {
            if (checkRectCollision(this, wall)) {
                if (input.x > 0) this.x = wall.x - this.width;
                else if (input.x < 0) this.x = wall.x + wall.width;
            }
        }
        // Constrain to canvas width
        this.x = Math.max(0, Math.min(CANVAS_WIDTH - this.width, this.x));

        // Y Movement
        this.y += input.y * this.speed;
        // Collision Y
        for (const wall of gameState.walls) {
            if (checkRectCollision(this, wall)) {
                if (input.y > 0) this.y = wall.y - this.height;
                else if (input.y < 0) this.y = wall.y + wall.height;
            }
        }

        // Distance Tracking (Score based on how far UP we go)
        // World Coordinates: Y decreases as we go UP. 
        // Initial Y is near CANVAS_HEIGHT.
        // Let's invert distance: Start 0. Moving up (decreasing Y) increases distance.
        const currentDist = Math.floor(Math.abs(Math.min(0, this.y - (CANVAS_HEIGHT - 100))) / 10);
        if (currentDist > gameState.distance) {
            gameState.distance = currentDist;
            // Add score for distance
            gameState.score += (currentDist - gameState.distance); 
        }

        // Wall of Doom Check
        // The wall of doom is a Y coordinate. If player.y > wallOfDoomY, die.
        // The wall moves UP (decreases Y) constantly.
        if (this.y + this.height > gameState.wallOfDoomY) {
            this.die();
        }

        // Check Trap Collisions
        for (const trap of gameState.traps) {
            if (trap.isActive && checkRectCollision(this, trap)) {
                if (this.invulnerable <= 0) {
                    this.die();
                }
            }
        }

        // Check Enemy Collisions
        for (const enemy of gameState.enemies) {
             // Simple hitbox
             let enemyRect = {x: enemy.x - enemy.radius, y: enemy.y - enemy.radius, width: enemy.radius*2, height: enemy.radius*2};
             if (checkRectCollision(this, enemyRect)) {
                 if (this.invulnerable <= 0) {
                     this.die();
                 }
             }
        }

        // Check Coin Collection
        for (let i = gameState.coins.length - 1; i >= 0; i--) {
            const coin = gameState.coins[i];
            if (checkRectCircleCollision(this, coin)) {
                gameState.score += coin.value;
                createSparkle(coin.x, coin.y);
                gameState.coins.splice(i, 1);
            }
        }
        
        // Win Condition
        if (gameState.distance >= 1000) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }

    die() {
        createExplosion(this.x + this.width/2, this.y + this.height/2, 20, [255, 0, 0]);
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p) {
        // Draw Player
        p.push();
        p.translate(this.x, this.y - gameState.cameraY);
        
        // Shadow
        p.fill(0, 0, 0, 50);
        p.ellipse(this.width/2, this.height, this.width, 10);

        // Body
        if (this.invulnerable > 0) {
            p.stroke(255, 255, 0);
            p.strokeWeight(2);
        } else {
            p.noStroke();
        }
        
        p.fill(50, 100, 255);
        p.rect(0, 0, this.width, this.height, 4);
        
        // Eyes
        p.fill(255);
        p.rect(4, 4, 4, 6);
        p.rect(12, 4, 4, 6);
        
        p.pop();
    }
}

export class Wall {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
    }

    render(p) {
        // Only render if visible
        if (this.y - gameState.cameraY > CANVAS_HEIGHT || this.y + this.height - gameState.cameraY < 0) return;

        p.push();
        p.translate(this.x, this.y - gameState.cameraY);
        p.fill(80, 70, 70);
        p.stroke(60, 50, 50);
        p.strokeWeight(2);
        p.rect(0, 0, this.width, this.height);
        // Detail
        p.line(0, 0, this.width, this.height);
        p.line(this.width, 0, 0, this.height);
        p.pop();
    }
}

export class SpikeTrap {
    constructor(x, y, phaseOffset = 0) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.isActive = false;
        this.timer = 0;
        this.phaseOffset = phaseOffset;
        this.cycleDuration = 120; // Frames
    }

    update(p) {
        this.timer = (p.frameCount + this.phaseOffset) % this.cycleDuration;
        // Active for half the cycle
        this.isActive = this.timer > 60;
    }

    render(p) {
        if (this.y - gameState.cameraY > CANVAS_HEIGHT || this.y + this.height - gameState.cameraY < 0) return;

        p.push();
        p.translate(this.x, this.y - gameState.cameraY);
        
        // Base
        p.fill(50);
        p.rect(0, 0, this.width, this.height);
        
        if (this.isActive) {
            p.fill(200, 200, 200);
            p.stroke(100);
            // Draw spikes
            p.triangle(5, 35, 10, 5, 15, 35);
            p.triangle(15, 35, 20, 5, 25, 35);
            p.triangle(25, 35, 30, 5, 35, 35);
        } else {
            // Warning holes
            p.fill(30);
            p.circle(10, 20, 5);
            p.circle(20, 20, 5);
            p.circle(30, 20, 5);
        }
        
        p.pop();
    }
}

export class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // "SLIME" or "BAT"
        this.radius = 15;
        this.originX = x;
        this.originY = y;
        this.vx = 2;
        this.angle = 0;
    }

    update(p) {
        if (this.type === "SLIME") {
            // Patrol horizontal
            this.x += this.vx;
            if (Math.abs(this.x - this.originX) > 60) {
                this.vx *= -1;
            }
        } else if (this.type === "BAT") {
            // Circle
            this.angle += 0.05;
            this.x = this.originX + Math.cos(this.angle) * 60;
            this.y = this.originY + Math.sin(this.angle) * 30;
        }
    }

    render(p) {
        if (this.y - gameState.cameraY > CANVAS_HEIGHT + 50 || this.y - gameState.cameraY < -50) return;

        p.push();
        p.translate(this.x, this.y - gameState.cameraY);
        
        if (this.type === "SLIME") {
            p.fill(100, 255, 100);
            p.arc(0, 5, 30, 30, p.PI, 0); // Semicircle
            p.fill(0);
            p.circle(-5, 0, 3);
            p.circle(5, 0, 3);
        } else if (this.type === "BAT") {
            p.fill(100, 100, 100);
            p.ellipse(0, 0, 30, 15);
            p.fill(255, 0, 0);
            p.circle(-4, -2, 2);
            p.circle(4, -2, 2);
            // Wings
            if (Math.sin(p.frameCount * 0.5) > 0) {
                 p.triangle(-10, 0, -25, -10, -10, -5);
                 p.triangle(10, 0, 25, -10, 10, -5);
            } else {
                 p.triangle(-10, 0, -25, 5, -10, 5);
                 p.triangle(10, 0, 25, 5, 10, 5);
            }
        }
        p.pop();
    }
}

export class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.value = 50;
    }

    render(p) {
        if (this.y - gameState.cameraY > CANVAS_HEIGHT + 50 || this.y - gameState.cameraY < -50) return;
        
        p.push();
        p.translate(this.x, this.y - gameState.cameraY);
        
        const pulse = Math.sin(p.frameCount * 0.1) * 2;
        p.fill(255, 215, 0);
        p.stroke(255, 255, 0);
        p.circle(0, 0, (this.radius * 2) + pulse);
        
        p.fill(255, 255, 200);
        p.noStroke();
        p.circle(-3, -3, 4);
        
        p.pop();
    }
}