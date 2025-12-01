export class Particle {
    constructor(x, y, type = "dust") {
        this.x = x;
        this.y = y;
        this.type = type;
        
        if (type === "dust") {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.lifetime = 30 + Math.random() * 20;
            this.size = Math.random() * 5 + 2;
            this.color = [200, 200, 200, 150];
        } else if (type === "sparkle") {
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = (Math.random() - 0.5) * 3;
            this.lifetime = 40;
            this.size = Math.random() * 4 + 1;
            this.color = [255, 255, 0, 200];
        } else if (type === "inflate") {
            this.vx = (Math.random() - 0.5) * 1;
            this.vy = (Math.random() * -1) - 0.5;
            this.lifetime = 20;
            this.size = Math.random() * 3;
            this.color = [255, 255, 255, 100];
        }
        
        this.age = 0;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.age++;
        
        if (this.type === "dust") {
            this.vy += 0.05; // gravity
            this.size *= 0.95;
        } else if (this.type === "sparkle") {
            this.vy *= 0.9;
        }
    }
    
    isDead() {
        return this.age >= this.lifetime || this.size < 0.1;
    }
    
    render(p) {
        const alpha = p.map(this.age, 0, this.lifetime, 255, 0);
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.circle(this.x, this.y, this.size);
    }
}

export function createExplosion(x, y, count, type) {
    // Lazy circular dependency fix: assume gameState is imported or passed
    // We will push to array passed in game loop context
    // This helper is used in game.js context
}