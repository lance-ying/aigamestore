import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CONSTANTS } from './globals.js';

export class Fish {
    constructor(y) {
        this.y = y;
        this.x = Math.random() * CANVAS_WIDTH;
        
        // Pick type based on depth
        const availableTypes = CONSTANTS.FISH_TYPES.filter(t => y >= t.depthMin && y <= t.depthMax);
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)] || CONSTANTS.FISH_TYPES[0];
        
        this.type = type;
        this.width = type.radius * 2;
        this.height = type.radius * 1.5; // Slight oval
        this.value = type.value;
        this.color = type.color;
        
        this.vx = (Math.random() < 0.5 ? -1 : 1) * type.speed;
        this.caught = false;
        this.isDead = false;
        
        // Physics for airborne state
        this.vy = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
    }

    update(p) {
        if (this.caught) return; // Managed by hook if caught

        if (gameState.subPhase === "DESCENT" || gameState.subPhase === "ASCENT") {
            this.x += this.vx;
            // Wrap around
            if (this.x > CANVAS_WIDTH + this.width) this.x = -this.width;
            if (this.x < -this.width) this.x = CANVAS_WIDTH + this.width;
        } else if (gameState.subPhase === "SHOOTING") {
            // Air physics
            this.x += this.vx;
            this.y += this.vy;
            this.vy += gameState.gravity;
            this.rotation += this.rotationSpeed;
            
            // Bounce off walls
            if (this.x < 0 || this.x > CANVAS_WIDTH) {
                this.vx *= -1;
            }
        }
    }

    render(p, cameraY = 0) {
        if (this.isDead) return;

        let renderX = this.x;
        let renderY = this.y - cameraY;

        if (gameState.subPhase === "SHOOTING") {
            // In shooting phase, y is screen space already mostly
            renderY = this.y; 
        } else {
             // In water, don't render if off screen
             if (renderY < -50 || renderY > CANVAS_HEIGHT + 50) return;
        }

        p.push();
        p.translate(renderX, renderY);
        if (gameState.subPhase === "SHOOTING") p.rotate(this.rotation);
        
        // Flip if moving left
        if (this.vx < 0 && gameState.subPhase !== "SHOOTING") p.scale(-1, 1);

        p.noStroke();
        p.fill(this.color);
        p.ellipse(0, 0, this.width, this.height);
        
        // Tail
        p.triangle(-this.width/2, 0, -this.width/2 - 10, -5, -this.width/2 - 10, 5);
        
        // Eye
        p.fill(255);
        p.circle(this.width/4, -this.height/4, 4);
        p.fill(0);
        p.circle(this.width/4 + 1, -this.height/4, 2);

        p.pop();
    }
}

export class Projectile {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.speed = 15;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.radius = 4;
        this.life = 0;
        this.maxLife = 100;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;
    }

    isDead() {
        return this.life > this.maxLife || 
               this.x < 0 || this.x > CANVAS_WIDTH || 
               this.y < 0 || this.y > CANVAS_HEIGHT;
    }

    render(p) {
        p.fill(255, 255, 0);
        p.noStroke();
        p.circle(this.x, this.y, this.radius * 2);
    }
}

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 30 + Math.random() * 20;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.vy += 0.1; // gravity
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], (this.life/50) * 255);
        p.circle(this.x, this.y, 3);
    }
}