// Particle system for visual effects

export class Particle {
    constructor(x, y, color, type = 'pixel') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type; // 'pixel', 'circle', 'sparkle'
        
        // Random velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.life = 1.0; // 1.0 to 0.0
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 4 + 2;
        this.gravity = 0.1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
    }

    render(p) {
        p.push();
        p.noStroke();
        
        // Convert hex/string color to p5 color with alpha
        const c = p.color(this.color);
        c.setAlpha(this.life * 255);
        p.fill(c);
        
        p.translate(this.x, this.y);
        
        if (this.type === 'pixel') {
            p.rect(0, 0, this.size, this.size);
        } else if (this.type === 'circle') {
            p.circle(0, 0, this.size);
        } else if (this.type === 'sparkle') {
            p.rotate(p.frameCount * 0.2);
            p.rect(0, 0, this.size, this.size/4);
            p.rect(0, 0, this.size/4, this.size);
        }
        
        p.pop();
    }

    isDead() {
        return this.life <= 0;
    }
}

export function createExplosion(x, y, color, count, gameState) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}