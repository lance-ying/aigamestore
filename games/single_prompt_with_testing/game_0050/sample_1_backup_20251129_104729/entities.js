import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, gameState } from './globals.js';
import { collideLineLine } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

export class Entity {
    constructor(id, x, y, color, territoryColor) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.color = color;
        this.territoryColor = territoryColor;
        this.radius = 6;
        
        this.heading = 0; // Radians
        this.speed = 2.0;
        this.boostSpeed = 3.5;
        this.turnSpeed = 0.08;
        
        this.trail = []; // Array of {x, y}
        this.isBoosting = false;
        this.alive = true;
        
        // Trail Optimization: don't add point every frame
        this.lastTrailPos = {x: x, y: y};
        this.trailInterval = 5; // Distance before adding new point
    }

    update(p) {
        if (!this.alive) return;

        // 1. Move
        const currentSpeed = this.isBoosting ? this.boostSpeed : this.speed;
        this.x += Math.cos(this.heading) * currentSpeed;
        this.y += Math.sin(this.heading) * currentSpeed;

        // 2. Bound checks (Walls are deadly)
        if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
            this.die("WALL_COLLISION");
            return;
        }

        // 3. Trail Logic
        const dist = Math.hypot(this.x - this.lastTrailPos.x, this.y - this.lastTrailPos.y);
        
        // Check if inside own territory
        const inOwnTerritory = gameState.worldGrid.isOwned(this.x, this.y, this.id);

        if (!inOwnTerritory) {
            // Currently outside: extending trail
            if (dist > this.trailInterval) {
                this.trail.push({x: this.x, y: this.y});
                this.lastTrailPos = {x: this.x, y: this.y};
            }
        } else {
            // Inside territory
            if (this.trail.length > 0) {
                // JUST ENTERED territory: Close the loop!
                this.trail.push({x: this.x, y: this.y}); // Add final point
                gameState.worldGrid.captureTerritory(this.trail, this.id, p);
                this.trail = []; // Clear trail
                
                // Audio cue simulation (visual flash)
                // p.background(255, 50); // too jarring? maybe particle effect
            }
            // Update last pos so we start a fresh trail correctly when leaving
            this.lastTrailPos = {x: this.x, y: this.y};
        }

        // 4. Self Trail Collision (Suicide)
        // Only check if trail is long enough to hit
        if (this.trail.length > 5) {
            // Check collision with all segments except the most recent few (to avoid self-clipping)
            for (let i = 0; i < this.trail.length - 3; i++) {
                const p1 = this.trail[i];
                const p2 = this.trail[i+1];
                // Simple point-to-segment distance check or line intersection?
                // p5.collide2d linePoint isn't imported, let's use circle-line
                // Actually, head is a point/circle.
                
                // Head segment
                const h1 = {x: this.x - Math.cos(this.heading) * 5, y: this.y - Math.sin(this.heading) * 5};
                const h2 = {x: this.x, y: this.y};
                
                if (collideLineLine(p1.x, p1.y, p2.x, p2.y, h1.x, h1.y, h2.x, h2.y)) {
                    this.die("SELF_TRAIL");
                    return;
                }
            }
        }
    }

    render(p) {
        if (!this.alive) return;

        // Draw Trail
        if (this.trail.length > 0) {
            p.noFill();
            p.stroke(this.color); // Full brightness
            p.strokeWeight(2);
            p.beginShape();
            for (let pt of this.trail) {
                p.vertex(pt.x, pt.y);
            }
            p.vertex(this.x, this.y); // Connect to head
            p.endShape();
            
            // Draw faint fill for trail polygon to indicate "active capture"
            // (Optional, can be performance heavy, skipping for now)
        }

        // Draw Player Head
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.heading);
        p.fill(255);
        p.stroke(this.color);
        p.strokeWeight(3);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 16, 16, 2);
        
        // Direction indicator
        // p.fill(0);
        // p.circle(5, 0, 4);
        p.pop();
    }

    die(reason) {
        if (!this.alive) return;
        this.alive = false;
        console.log(`Entity ${this.id} died: ${reason}`);
        
        // Remove territory
        if (gameState.worldGrid) {
            gameState.worldGrid.clearTerritory(this.id, window.gameInstance);
        }

        // Trigger particles
        // (Assuming particle system exists in gameState)
        // createExplosion(this.x, this.y, this.color);
        
        if (this.id === 1) { // Player
            gameState.gamePhase = "GAME_OVER_LOSE";
        } else {
            // Remove from enemies list logic handled in game loop
        }
    }
}

export class Player extends Entity {
    constructor(x, y) {
        super(1, x, y, COLORS.PLAYER, COLORS.PLAYER_TERRITORY);
    }
    
    update(p) {
        super.update(p);
        
        // Log player info
        if (p.frameCount % 10 === 0) {
             p.logs.player_info.push({
                x: this.x,
                y: this.y,
                trailLength: this.trail.length,
                score: gameState.score,
                alive: this.alive,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }
}

export class Bot extends Entity {
    constructor(id, x, y, color, territoryColor) {
        super(id, x, y, color, territoryColor);
        this.changeDirTimer = 0;
        this.targetDir = Math.random() * Math.PI * 2;
    }

    update(p) {
        // AI Logic
        this.changeDirTimer--;
        
        if (this.changeDirTimer <= 0) {
            // Pick a new target direction
            // Simple AI: Prefer moving towards center if too close to edge
            const margin = 50;
            if (this.x < margin) this.targetDir = 0;
            else if (this.x > CANVAS_WIDTH - margin) this.targetDir = Math.PI;
            else if (this.y < margin) this.targetDir = Math.PI / 2;
            else if (this.y > CANVAS_HEIGHT - margin) this.targetDir = 3 * Math.PI / 2;
            else {
                // Random wander + bias towards unowned territory?
                // For simplicity: random wander
                this.targetDir = (Math.random() * Math.PI * 2);
            }
            
            // Randomize timer
            this.changeDirTimer = 30 + Math.random() * 60;
        }

        // Smoothly rotate towards targetDir
        // Shortest angle difference
        let diff = this.targetDir - this.heading;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        
        if (Math.abs(diff) > this.turnSpeed) {
            this.heading += Math.sign(diff) * this.turnSpeed;
        } else {
            this.heading = this.targetDir;
        }

        super.update(p);
    }
}