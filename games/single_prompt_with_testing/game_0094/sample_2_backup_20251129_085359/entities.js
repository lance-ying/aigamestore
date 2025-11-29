// entities.js
import { 
    CANVAS_WIDTH, CELL_WIDTH, CELL_HEIGHT, 
    GRID_OFFSET_X, GRID_OFFSET_Y, 
    gameState, PLANT_TYPES 
} from './globals.js';

// --- Base Entity ---
export class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 0;
        this.height = 0;
        this.markedForDeletion = false;
        this.age = 0;
    }

    update(p) {
        this.age++;
    }

    render(p) {
        // Override
    }
}

// --- Plants ---
export class Plant extends Entity {
    constructor(col, row, type) {
        const x = GRID_OFFSET_X + col * CELL_WIDTH + CELL_WIDTH / 2;
        const y = GRID_OFFSET_Y + row * CELL_HEIGHT + CELL_HEIGHT / 2;
        super(x, y);
        
        this.col = col;
        this.row = row;
        this.type = type;
        this.maxHp = type.hp;
        this.hp = type.hp;
        
        this.actionTimer = 0;
        this.flashTimer = 0; // For hit effect
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.flashTimer = 10;
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        this.markedForDeletion = true;
        // Free up grid slot
        if (gameState.grid[this.col] && gameState.grid[this.col][this.row] === this) {
            gameState.grid[this.col][this.row] = null;
        }
        
        // Spawn debris particles
        for(let i=0; i<5; i++) {
            gameState.particles.push(new Particle(this.x, this.y, this.type.color));
        }
    }

    update(p) {
        super.update(p);
        if (this.flashTimer > 0) this.flashTimer--;
        
        // Specific logic per type
        if (this.type.id === 'SUNFLOWER') {
            this.actionTimer++;
            // Generate sun every ~10 seconds (600 frames)
            if (this.actionTimer >= 600) {
                this.actionTimer = 0;
                spawnSun(this.x, this.y - 20, false); // false = not from sky
            }
        } else if (this.type.id === 'PEASHOOTER') {
            this.actionTimer++;
            // Shoot every ~1.5 seconds (90 frames) if zombies in lane
            if (this.actionTimer >= 90) {
                // Check if zombie in lane
                const zombieInLane = gameState.zombies.some(z => 
                    z.row === this.row && z.x > this.x && z.x < CANVAS_WIDTH + 50
                );
                
                if (zombieInLane) {
                    this.actionTimer = 0;
                    gameState.projectiles.push(new Projectile(this.x + 20, this.y - 10, this.row));
                } else {
                    // Clamp timer so it shoots immediately when zombie appears
                    this.actionTimer = 90;
                }
            }
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Hit flash
        if (this.flashTimer > 0) {
            p.tint(255, 200); // Only works with images, for shapes we change fill
            p.fill(255);
        } else {
            p.fill(this.type.color);
        }

        // Bobbing animation
        const bob = p.sin(this.age * 0.1) * 2;

        if (this.type.id === 'SUNFLOWER') {
            // Petals
            p.push();
            p.rotate(this.age * 0.02);
            p.fill(243, 156, 18);
            for(let i=0; i<8; i++) {
                p.triangle(0, -15, -6, -25, 6, -25);
                p.rotate(p.PI/4);
            }
            p.pop();
            // Face
            p.fill(this.flashTimer > 0 ? 255 : this.type.color);
            p.circle(0, bob, 30);
            p.fill(100, 50, 0);
            p.circle(-7, bob-5, 4); // eyes
            p.circle(7, bob-5, 4);
            p.arc(0, bob+5, 10, 8, 0, p.PI); // smile
            
        } else if (this.type.id === 'PEASHOOTER') {
            // Head
            p.circle(0, -10 + bob, 30);
            // Snout
            p.rectMode(p.CENTER);
            p.rect(15, -10 + bob, 20, 15);
            // Base/Stem
            p.fill(39, 174, 96);
            p.rect(0, 15, 8, 20);
            p.fill(0);
            p.circle(25, -10 + bob, 8); // Hole
            
        } else if (this.type.id === 'WALLNUT') {
            // Body
            p.ellipse(0, bob, 35, 45);
            // Cracks based on HP
            p.stroke(60, 30, 10);
            p.noFill();
            if (this.hp < this.maxHp * 0.7) {
                p.line(-10, -10, 0, 0);
            }
            if (this.hp < this.maxHp * 0.4) {
                p.line(10, -5, 0, 5);
                p.line(0, 0, -5, 10);
            }
            // Face
            p.noStroke();
            p.fill(0);
            p.circle(-8, -5 + bob, 4);
            p.circle(8, -5 + bob, 4);
            // Worried mouth
            p.noFill();
            p.stroke(0);
            p.strokeWeight(1);
            p.arc(0, 8 + bob, 10, 5, p.PI, 0);
        }

        // Health bar if damaged
        if (this.hp < this.maxHp) {
            p.noStroke();
            p.fill(255, 0, 0);
            p.rectMode(p.CORNER);
            p.rect(-20, 25, 40, 4);
            p.fill(0, 255, 0);
            p.rect(-20, 25, 40 * (this.hp / this.maxHp), 4);
        }

        p.pop();
    }
}

// --- Zombies ---
export class Zombie extends Entity {
    constructor(row) {
        const x = CANVAS_WIDTH + 20;
        const y = GRID_OFFSET_Y + row * CELL_HEIGHT + CELL_HEIGHT / 2 - 20; // Offset up slightly
        super(x, y);
        
        this.row = row;
        this.width = 30;
        this.height = 50;
        this.speed = 0.3 + Math.random() * 0.2; // Variable speed
        this.maxHp = 200;
        this.hp = this.maxHp;
        this.damage = 1; // DPS essentially (applied per frame)
        this.isEating = false;
        
        this.walkCycle = 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.markedForDeletion = true;
        gameState.score += 20;
        // Particles
        for(let i=0; i<8; i++) {
            gameState.particles.push(new Particle(this.x, this.y, [100, 100, 200]));
        }
    }

    update(p) {
        super.update(p);
        
        // Find plant to eat
        // Map current x to col
        const col = Math.floor((this.x - GRID_OFFSET_X) / CELL_WIDTH);
        let plant = null;
        
        if (col >= 0 && col < GRID_COLS) {
            plant = gameState.grid[col][this.row];
        }

        // Interaction range
        const eatingRange = 30;
        if (plant && Math.abs(plant.x - this.x) < eatingRange) {
            this.isEating = true;
            plant.takeDamage(this.damage);
        } else {
            this.isEating = false;
            this.x -= this.speed;
        }

        // Check lose condition
        if (this.x < 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
        
        this.walkCycle += 0.2;
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        const sway = p.sin(this.walkCycle) * 5;
        const bounce = Math.abs(p.cos(this.walkCycle)) * 3;
        
        // Shadow
        p.fill(0, 100);
        p.noStroke();
        p.ellipse(0, 50, 40, 10);
        
        // Body (lean forward)
        p.rotate(-0.1); 
        
        // Legs
        p.stroke(50);
        p.strokeWeight(6);
        p.line(-5, 20, -10 + sway, 50); // Back leg
        p.line(5, 20, 10 - sway, 50);   // Front leg
        
        // Torso
        p.noStroke();
        p.fill(60, 80, 100); // Jacket color
        p.rectMode(p.CENTER);
        p.rect(0, 10 - bounce, 25, 35);
        
        // Head
        p.fill(150, 170, 150); // Zombie skin
        p.circle(0 + sway*0.2, -15 - bounce, 25);
        
        // Eyes
        p.fill(255);
        p.circle(5 + sway*0.2, -18 - bounce, 8);
        p.fill(0);
        p.circle(5 + sway*0.2, -18 - bounce, 3);
        
        // Arm (eating animation or walking)
        p.stroke(150, 170, 150);
        p.strokeWeight(6);
        if (this.isEating) {
            const bite = p.sin(this.age * 0.5) * 10;
            p.line(10, 0, 25 + bite, -5);
        } else {
            p.line(10, 0, 20, 10 + sway);
        }

        p.pop();
    }
}

// --- Projectile ---
export class Projectile extends Entity {
    constructor(x, y, row) {
        super(x, y);
        this.row = row;
        this.speed = 6;
        this.radius = 6;
        this.damage = 25;
    }

    update(p) {
        super.update(p);
        this.x += this.speed;
        
        // Bounds check
        if (this.x > CANVAS_WIDTH) {
            this.markedForDeletion = true;
        }
        
        // Collision with zombies
        for (const zombie of gameState.zombies) {
            if (zombie.row === this.row && !zombie.markedForDeletion) {
                const dist = Math.abs(zombie.x - this.x);
                if (dist < zombie.width) {
                    zombie.takeDamage(this.damage);
                    this.markedForDeletion = true;
                    // Impact poof
                    gameState.particles.push(new Particle(this.x, this.y, [46, 204, 113]));
                    break;
                }
            }
        }
    }

    render(p) {
        p.fill(46, 204, 113); // Pea green
        p.noStroke();
        p.circle(this.x, this.y, this.radius * 2);
        // Trail
        p.fill(46, 204, 113, 100);
        p.circle(this.x - 5, this.y, this.radius * 1.5);
    }
}

// --- Sun ---
export class Sun extends Entity {
    constructor(x, y, isFromSky = true) {
        super(x, y);
        this.targetY = isFromSky ? y + 200 + Math.random() * 100 : y;
        if (this.targetY > CANVAS_HEIGHT - 50) this.targetY = CANVAS_HEIGHT - 50;
        
        this.isFromSky = isFromSky;
        this.dy = isFromSky ? 2 : 0;
        this.radius = 20;
        this.value = 25;
        this.collected = false;
        
        this.lifeTime = 600; // 10 seconds before disappearing
        this.fadeAlpha = 255;
    }

    collect() {
        if (this.collected) return;
        this.collected = true;
        gameState.sun += this.value;
        // Log collection
        if (typeof window !== 'undefined' && window.p5 && window.p5.prototype.logs) {
            // Note: direct log access via p not easily avail here, we assume core loop handles it or global exposure
        }
    }

    update(p) {
        super.update(p);
        
        // Fall if from sky
        if (this.isFromSky && this.y < this.targetY) {
            this.y += this.dy;
        }
        
        // Lifetime
        this.lifeTime--;
        if (this.lifeTime < 60) {
            this.fadeAlpha = p.map(this.lifeTime, 0, 60, 0, 255);
        }
        if (this.lifeTime <= 0) {
            this.markedForDeletion = true;
        }

        // Animation for collection (fly to top left)
        if (this.collected) {
            const destX = 30;
            const destY = 30;
            this.x = p.lerp(this.x, destX, 0.1);
            this.y = p.lerp(this.y, destY, 0.1);
            this.radius *= 0.9;
            if (this.radius < 2) {
                this.markedForDeletion = true;
            }
        } else {
            // Check collision with cursor
            // Get cursor pixel pos
            const curCol = gameState.cursor.col;
            const curRow = gameState.cursor.row;
            const curX = GRID_OFFSET_X + curCol * CELL_WIDTH + CELL_WIDTH/2;
            const curY = GRID_OFFSET_Y + curRow * CELL_HEIGHT + CELL_HEIGHT/2;
            
            // Simple distance check to cursor center
            // OR checks if sun is inside the grid cell of cursor
            // Let's use distance
            const d = p.dist(this.x, this.y, curX, curY);
            if (d < 40) { // generous radius
                this.collect();
            }
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.age * 0.05);
        
        const alpha = this.collected ? 255 : this.fadeAlpha;
        p.fill(241, 196, 15, alpha);
        p.stroke(243, 156, 18, alpha);
        p.strokeWeight(2);
        
        // Sun body
        p.circle(0, 0, this.radius * 2);
        
        // Rays
        if (!this.collected) {
            for(let i=0; i<8; i++) {
                p.line(15, 0, 22, 0);
                p.rotate(p.PI/4);
            }
        }
        
        p.pop();
    }
}

// --- Particle ---
export class Particle extends Entity {
    constructor(x, y, color) {
        super(x, y);
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.color = color;
        this.life = 30;
        this.size = Math.random() * 5 + 2;
    }
    
    update(p) {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.life <= 0) this.markedForDeletion = true;
    }
    
    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], p.map(this.life, 0, 30, 0, 255));
        p.circle(this.x, this.y, this.size);
    }
}

// Helper to spawn sun
export function spawnSun(x, y, fromSky) {
    const s = new Sun(x, y, fromSky);
    gameState.suns.push(s);
    gameState.entities.push(s);
}