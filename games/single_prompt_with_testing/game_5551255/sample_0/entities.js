import { gameState, CELL_SIZE, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { checkAABB, getSlideDestination } from './physics.js';
import { createExplosion, createTrail } from './particles.js';

export class Wall {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }

    render(p) {
        // Only render if on screen
        const screenY = this.y - gameState.cameraY;
        if (screenY > CANVAS_HEIGHT || screenY + this.height < 0) return;

        p.fill(40, 40, 60);
        p.stroke(0, 255, 255);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Inner detail
        p.noStroke();
        p.fill(0, 200, 200, 50);
        p.rect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
    }
}

export class Coin {
    constructor(x, y) {
        this.x = x + CELL_SIZE/2; // Center in cell
        this.y = y + CELL_SIZE/2;
        this.radius = 6;
        this.width = this.radius * 2;
        this.height = this.radius * 2;
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    render(p) {
        const screenY = this.y - gameState.cameraY;
        if (screenY > CANVAS_HEIGHT + 20 || screenY < -20) return;

        const bobY = Math.sin(gameState.frameCount * 0.1 + this.bobOffset) * 3;
        
        p.push();
        p.translate(this.x, this.y + bobY);
        p.rotate(gameState.frameCount * 0.05);
        p.fill(255, 215, 0);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, 10, 10);
        p.pop();
    }
}

export class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = CELL_SIZE;
        this.height = CELL_SIZE;
        this.type = type || 'BAT'; // BAT, SPIKE_MOVING
        
        this.vx = 2;
        this.vy = 0;
        this.patrolDist = 0;
        this.maxPatrol = 100;
        this.dir = 1;
    }
    
    update() {
        // Simple patrol logic
        this.x += this.vx * this.dir;
        this.patrolDist += Math.abs(this.vx);
        
        // Check wall collisions to turn around
        let hitWall = false;
        const myRect = {x: this.x, y: this.y, width: this.width, height: this.height};
        
        for (let wall of gameState.walls) {
            // Optimization: checks nearby walls only?
            if (Math.abs(wall.y - this.y) < 50 && Math.abs(wall.x - this.x) < 50) {
                if (checkAABB(myRect, wall)) {
                    hitWall = true;
                    break;
                }
            }
        }

        if (this.patrolDist > this.maxPatrol || hitWall) {
            this.dir *= -1;
            this.x += this.vx * this.dir * 2; // Unstick
            this.patrolDist = 0;
        }
    }
    
    render(p) {
        const screenY = this.y - gameState.cameraY;
        if (screenY > CANVAS_HEIGHT || screenY + this.height < 0) return;
        
        p.fill(255, 50, 50);
        p.noStroke();
        
        // Draw Spiky Enemy
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        const scale = 1 + Math.sin(gameState.frameCount * 0.2) * 0.1;
        p.scale(scale);
        
        p.beginShape();
        for(let i=0; i<8; i++) {
            let angle = (Math.PI * 2 / 8) * i;
            let r = (i % 2 === 0) ? 10 : 5;
            p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        p.endShape(p.CLOSE);
        p.pop();
    }
}

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        
        this.vx = 0;
        this.vy = 0;
        this.speed = 10; // High speed for dash
        
        this.state = "IDLE"; // IDLE, MOVING
        this.queuedInput = null;
    }

    update(p) {
        // Check Tide Death
        if (this.y > gameState.tideY) {
            this.die();
            return;
        }

        // MOVEMENT
        if (this.state === "MOVING") {
            // Create Trail
            if (gameState.frameCount % 3 === 0) {
                createTrail(this.x, this.y, this.width, this.height, p.color(255, 255, 0));
            }

            // Move
            // We move in steps to prevent tunneling, or use the pre-calculated distance
            // For simplicity and speed in this grid, we move by speed but clamp to walls.
            // Actually, let's use the simplified approach:
            // Calculate distance to nearest wall in direction. 
            // If distance < speed, move distance and STOP.
            // Else move speed.
            
            const dist = getSlideDestination(this.x, this.y, this.width, this.height, this.vx, this.vy, gameState.walls);
            
            // Should not be null ideally
            const moveDist = dist !== null ? dist : this.speed;
            
            if (moveDist <= this.speed) {
                // Hit wall
                this.x += (this.vx / this.speed) * moveDist;
                this.y += (this.vy / this.speed) * moveDist;
                this.vx = 0;
                this.vy = 0;
                this.state = "IDLE";
                
                // Visual impact
                createExplosion(this.x + this.width/2, this.y + this.height/2, 5, p.color(200, 200, 255));
                
                // Align to grid slightly to fix floating point errors?
                // Not strictly necessary if collision is robust, but helps.
                // this.x = Math.round(this.x);
                // this.y = Math.round(this.y);
                
            } else {
                this.x += this.vx;
                this.y += this.vy;
            }
        }

        // COIN COLLISION
        for (let i = gameState.coins.length - 1; i >= 0; i--) {
            const coin = gameState.coins[i];
            const dx = (this.x + this.width/2) - coin.x;
            const dy = (this.y + this.height/2) - coin.y;
            if (Math.sqrt(dx*dx + dy*dy) < this.width/2 + coin.radius) {
                gameState.score += 10;
                gameState.coins.splice(i, 1);
                createExplosion(coin.x, coin.y, 8, p.color(255, 215, 0));
            }
        }

        // ENEMY COLLISION
        for (let enemy of gameState.enemies) {
            if (checkAABB(this, {x: enemy.x + 4, y: enemy.y + 4, width: enemy.width - 8, height: enemy.height - 8})) {
                this.die();
                return;
            }
        }
        
        // Log info
        if(p.logs && p.logs.player_info) {
             p.logs.player_info.push({
                x: this.x,
                y: this.y,
                state: this.state,
                frame: gameState.frameCount
             });
        }
    }
    
    move(dx, dy) {
        if (this.state === "IDLE") {
            this.vx = dx * this.speed;
            this.vy = dy * this.speed;
            if (dx !== 0 || dy !== 0) {
                this.state = "MOVING";
            }
        }
    }

    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
        createExplosion(this.x, this.y, 50, {levels: [255, 0, 0]}); // Hacky color obj pass
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Yellow Square body
        p.fill(255, 255, 0);
        p.stroke(255, 200, 0);
        p.strokeWeight(2);
        p.rect(0, 0, this.width, this.height, 4);
        
        // Eyes (Mask look)
        p.fill(0);
        p.noStroke();
        if (Math.abs(this.vx) > 0) {
            // Squint when moving horizontally
            p.rect(3, 4, 4, 2);
            p.rect(9, 4, 4, 2);
        } else if (Math.abs(this.vy) > 0) {
            // Vertical movement eyes
            p.circle(5, 5, 3);
            p.circle(11, 5, 3);
        } else {
            // Idle eyes
            p.circle(5, 6, 4);
            p.circle(11, 6, 4);
        }
        
        p.pop();
    }
}