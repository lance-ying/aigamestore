import { COLORS, gameState } from './globals.js';

export class Entity {
    constructor(id, x, y, color, territoryColor) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.color = color;
        this.territoryColor = territoryColor;
        this.radius = 6;
        
        this.heading = 0;
        this.speed = 2.0;
        this.boostSpeed = 3.5;
        this.turnSpeed = 0.08;
        
        this.trail = [];
        this.isBoosting = false;
        this.alive = true;
        
        this.lastTrailPos = {x: x, y: y};
        this.trailInterval = 5;
    }

    update(p) {
        if (!this.alive) return;

        // 1. Move
        const currentSpeed = this.isBoosting ? this.boostSpeed : this.speed;
        this.x += Math.cos(this.heading) * currentSpeed;
        this.y += Math.sin(this.heading) * currentSpeed;

        // 2. Bound checks (World boundaries are deadly)
        if (this.x < 0 || this.x > gameState.worldWidth || 
            this.y < 0 || this.y > gameState.worldHeight) {
            this.die("WALL_COLLISION");
            return;
        }

        // 3. Trail Logic
        const dist = Math.hypot(this.x - this.lastTrailPos.x, this.y - this.lastTrailPos.y);
        
        const inOwnTerritory = gameState.worldGrid.isOwned(this.x, this.y, this.id);

        if (!inOwnTerritory) {
            if (dist > this.trailInterval) {
                this.trail.push({x: this.x, y: this.y});
                this.lastTrailPos = {x: this.x, y: this.y};
            }
        } else {
            if (this.trail.length > 0) {
                this.trail.push({x: this.x, y: this.y});
                gameState.worldGrid.captureTerritory(this.trail, this.id, p);
                this.trail = [];
            }
            this.lastTrailPos = {x: this.x, y: this.y};
        }

        // 4. Self Trail Collision
        if (this.trail.length > 5) {
            for (let i = 0; i < this.trail.length - 3; i++) {
                const p1 = this.trail[i];
                const p2 = this.trail[i+1];
                
                const h1 = {x: this.x - Math.cos(this.heading) * 5, y: this.y - Math.sin(this.heading) * 5};
                const h2 = {x: this.x, y: this.y};
                
                if (p.collideLineLine(p1.x, p1.y, p2.x, p2.y, h1.x, h1.y, h2.x, h2.y)) {
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
            p.stroke(this.color);
            p.strokeWeight(2);
            p.beginShape();
            for (let pt of this.trail) {
                p.vertex(pt.x, pt.y);
            }
            p.vertex(this.x, this.y);
            p.endShape();
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
        p.pop();
    }

    die(reason) {
        if (!this.alive) return;
        this.alive = false;
        console.log(`Entity ${this.id} died: ${reason}`);
        
        if (gameState.worldGrid) {
            gameState.worldGrid.clearTerritory(this.id, window.gameInstance);
        }
        
        if (this.id === 1) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }
}

export class Player extends Entity {
    constructor(x, y) {
        super(1, x, y, COLORS.PLAYER, COLORS.PLAYER_TERRITORY);
    }
    
    update(p) {
        super.update(p);
        
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
        this.changeDirTimer--;
        
        if (this.changeDirTimer <= 0) {
            const margin = 50;
            if (this.x < margin) this.targetDir = 0;
            else if (this.x > gameState.worldWidth - margin) this.targetDir = Math.PI;
            else if (this.y < margin) this.targetDir = Math.PI / 2;
            else if (this.y > gameState.worldHeight - margin) this.targetDir = 3 * Math.PI / 2;
            else {
                this.targetDir = (Math.random() * Math.PI * 2);
            }
            
            this.changeDirTimer = 30 + Math.random() * 60;
        }

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