import { GRID_SIZE, COLORS, gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { ParticleSystem } from './particles.js';
import { isSolid } from './physics.js';
import { scheduleAutoRestart } from './input.js'; // Import the new auto-restart function

export class Player {
    constructor(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY; // 0 is start, -1 is forward, 1 is backward
        
        // Visual position (pixel coordinates)
        this.visualX = gridX * GRID_SIZE;
        this.visualY = gridY * GRID_SIZE;
        
        // Movement state
        this.isMoving = false;
        this.moveStartX = 0;
        this.moveStartY = 0;
        this.moveTargetX = 0;
        this.moveTargetY = 0;
        this.moveProgress = 0;
        this.moveSpeed = 0.15; // Speed of hop animation
        
        // Render state
        this.width = GRID_SIZE * 0.6;
        this.height = GRID_SIZE * 0.6;
        this.jumpHeight = GRID_SIZE * 0.5;
        this.facing = 'UP'; // UP, DOWN, LEFT, RIGHT
        this.squash = 1.0;
        
        this.isDead = false;
        this.score = 0;
        this.maxGridY = 0; // Furthest distance reached (negative value usually)
        
        // River crossing hop charge mechanic
        this.hasHopCharge = false;
        this.isDoubleHopArmed = false; // Whether ENTER was pressed to arm the double hop
        this.previousLaneType = null;
    }
    
    queueMove(dx, dy, useCharge = false) {
        if (this.isDead || this.isMoving) return;
        
        // Store previous lane type before moving
        const currentLane = gameState.laneManager.getLaneAt(this.gridY);
        this.previousLaneType = currentLane ? currentLane.type : null;
        
        // Apply hop charge only if explicitly requested via useCharge parameter
        let moveDx = dx;
        let moveDy = dy;
        if (useCharge && this.hasHopCharge && (dx !== 0 || dy !== 0)) {
            moveDx *= 2;
            moveDy *= 2;
            this.hasHopCharge = false; // Consume charge
            this.isDoubleHopArmed = false; // Clear armed state
        }
        
        const targetGridX = this.gridX + moveDx;
        const targetGridY = this.gridY + moveDy;
        
        // Set facing
        if (moveDx > 0) this.facing = 'RIGHT';
        if (moveDx < 0) this.facing = 'LEFT';
        if (moveDy > 0) this.facing = 'DOWN';
        if (moveDy < 0) this.facing = 'UP';
        
        // Boundary Check (Left/Right)
        const maxCols = Math.floor(CANVAS_WIDTH / GRID_SIZE);
        if (targetGridX < 0 || targetGridX >= maxCols) return;
        
        // Solid Check (Trees) - only at target, hop over intermediate obstacles
        if (isSolid(targetGridX, targetGridY)) return;
        
        // Start Move
        this.isMoving = true;
        this.moveProgress = 0;
        this.moveStartX = this.visualX;
        this.moveStartY = this.visualY;
        
        // Logic Update Immediately
        this.gridX = targetGridX;
        this.gridY = targetGridY;
        
        // Calculate target visual
        this.moveTargetX = targetGridX * GRID_SIZE;
        this.moveTargetY = targetGridY * GRID_SIZE;
        
        // Score update
        const distance = -this.gridY;
        if (distance > this.score) {
            this.score = distance;
            gameState.score = this.score;
        }
    }
    
    update(p) {
        if (this.isDead) return;

        if (this.isMoving) {
            this.moveProgress += this.moveSpeed;
            if (this.moveProgress >= 1) {
                this.moveProgress = 1;
                this.isMoving = false;
                this.visualX = this.moveTargetX;
                this.visualY = this.moveTargetY;
                
                // Check for river crossing - grant hop charge
                const currentLane = gameState.laneManager.getLaneAt(this.gridY);
                if (this.previousLaneType === 'WATER' && currentLane && currentLane.type !== 'WATER') {
                    this.hasHopCharge = true;
                }
                
                // Landing squash effect
                this.squash = 1.3; 
                
                // Dust particles
                gameState.particles.push(new ParticleSystem(this.visualX + GRID_SIZE/2, this.visualY + GRID_SIZE/2, 'DUST'));
            }
            
            // Lerp position
            const t = this.moveProgress;
            this.visualX = p.lerp(this.moveStartX, this.moveTargetX, t);
            this.visualY = p.lerp(this.moveStartY, this.moveTargetY, t);
        } else {
            // Relax squash
            this.squash = p.lerp(this.squash, 1.0, 0.2);
            
            // Update gridX based on visualX (reverse mapping for proper column calculation if drifting on log)
            this.gridX = Math.round(this.visualX / GRID_SIZE);
        }
    }
    
    isJumping() {
        return this.isMoving && this.moveProgress > 0.2 && this.moveProgress < 0.8;
    }
    
    render(p) {
        if (this.isDead) return; // Or render flattened corpse
        
        const centerX = this.visualX + GRID_SIZE / 2;
        const centerY = this.visualY + GRID_SIZE / 2;
        
        // Calculate Jump Offset (Parabola)
        let jumpY = 0;
        if (this.isMoving) {
            // For double hops, jump higher
            const distance = Math.abs(this.moveTargetX - this.moveStartX) + Math.abs(this.moveTargetY - this.moveStartY);
            const isDoubleHop = distance > GRID_SIZE * 1.5;
            const heightMultiplier = isDoubleHop ? 1.5 : 1.0;
            jumpY = -Math.sin(this.moveProgress * Math.PI) * this.jumpHeight * heightMultiplier;
        }
        
        p.push();
        p.translate(centerX, centerY + jumpY);
        
        // Visual indicator for hop charge (glowing aura)
        if (this.hasHopCharge && !this.isMoving) {
            const alpha = this.isDoubleHopArmed ? 200 : (100 + Math.sin(p.frameCount * 0.2) * 50);
            p.noStroke();
            p.fill(100, 200, 255, alpha);
            p.circle(0, 0, this.width * 1.5);
            
            // Extra pulsing effect when armed
            if (this.isDoubleHopArmed) {
                p.fill(255, 255, 255, 100 + Math.sin(p.frameCount * 0.3) * 100);
                p.circle(0, 0, this.width * 1.8);
            }
        }
        
        // Squash and stretch
        // Scale Y inversely to X to maintain volume illusion
        p.scale(1 / this.squash, this.squash);
        
        // Shadow (if jumping, shadow stays on ground, but fades/shrinks)
        if (jumpY < 0) {
            p.push();
            p.translate(0, -jumpY); // Move back down to ground
            p.scale(this.squash, 1/this.squash); // Unsquash for shadow
            p.fill(0, 50);
            p.noStroke();
            const shadowSize = this.width * (1 - Math.abs(jumpY)/100);
            p.ellipse(0, 10, shadowSize, shadowSize * 0.5);
            p.pop();
        }
        
        // Draw Body
        p.fill(COLORS.PLAYER);
        p.stroke(COLORS.PLAYER_ACCENT);
        p.strokeWeight(2);
        p.rectMode(p.CENTER);
        
        // Rotate based on facing? Or just move eyes.
        // Let's rotate slightly for effect
        if (this.isMoving) {
             // Tilt forward slightly
             // Simple 2D rotation isn't great for top down 2.5D, skip rotation
        }
        
        p.rect(0, 0, this.width, this.height, 5);
        
        // Eyes / Beak
        p.noStroke();
        p.fill(0);
        let eyeOffsetX = 0, eyeOffsetY = 0;
        let beakOffsetX = 0, beakOffsetY = 0;
        
        if (this.facing === 'RIGHT') { eyeOffsetX = 6; beakOffsetX = 10; }
        if (this.facing === 'LEFT') { eyeOffsetX = -6; beakOffsetX = -10; }
        if (this.facing === 'DOWN') { eyeOffsetY = 6; beakOffsetY = 10; }
        if (this.facing === 'UP') { eyeOffsetY = -6; beakOffsetY = -10; }
        
        if (this.facing === 'RIGHT' || this.facing === 'LEFT') {
             p.circle(eyeOffsetX, -4, 4);
             p.fill(255, 100, 0);
             p.triangle(beakOffsetX, 0, beakOffsetX - (Math.sign(beakOffsetX)*4), -3, beakOffsetX - (Math.sign(beakOffsetX)*4), 3);
        } else {
             // Front/Back view
             if (this.facing === 'DOWN') {
                 p.circle(-6, 2, 4);
                 p.circle(6, 2, 4);
                 p.fill(255, 100, 0);
                 p.triangle(0, 8, -3, 4, 3, 4);
             }
        }

        p.pop();
    }
    
    getHitbox() {
        return {
            x: this.visualX + (GRID_SIZE - this.width)/2,
            y: this.visualY + (GRID_SIZE - this.height)/2,
            w: this.width,
            h: this.height
        };
    }
    
    die(reason, p) { // Added 'p' parameter
        if (this.isDead) return;
        this.isDead = true;
        console.log(`Player died: ${reason}`);
        
        // Spawn death particles
        gameState.particles.push(new ParticleSystem(this.visualX + GRID_SIZE/2, this.visualY + GRID_SIZE/2, 'EXPLOSION'));
        
        // Set game over phase immediately
        gameState.gamePhase = "GAME_OVER_LOSE";

        // Schedule auto-restart after 1 second
        scheduleAutoRestart(p);
    }
}

export class Obstacle {
    constructor(x, y, width, height, speed, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.color = color;
    }
    
    update() {
        this.x += this.speed;
    }
    
    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        p.fill(this.color);
        p.stroke(0, 50);
        p.strokeWeight(2);
        p.rectMode(p.CENTER);
        
        // Car detail (windows)
        p.rect(0, 0, this.width, this.height, 4);
        
        p.fill(200, 200, 255);
        p.noStroke();
        p.rect(0, 0, this.width * 0.5, this.height * 0.6, 2);
        
        p.pop();
    }
    
    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            w: this.width,
            h: this.height
        };
    }
}

export class Log extends Obstacle {
    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.fill(COLORS.LOG);
        p.stroke(62, 39, 35);
        p.strokeWeight(2);
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height, 6);
        
        // Wood grain details
        p.stroke(100, 70, 60);
        p.line(-this.width/3, 0, -this.width/4, 0);
        p.line(0, 0, this.width/4, 0);
        p.pop();
    }
}

export class Train extends Obstacle {
    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.fill(COLORS.TRAIN);
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height, 2);
        
        // Windows
        p.fill(255, 255, 200);
        const windows = Math.floor(this.width / 30);
        for(let i=0; i<windows; i++) {
            p.rect(-this.width/2 + 15 + i*30, 0, 20, this.height-6);
        }
        p.pop();
    }
}