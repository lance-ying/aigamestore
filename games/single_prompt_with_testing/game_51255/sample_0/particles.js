export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'CONFETTI', 'FLAME', 'SMOKE'
        this.age = 0;
        
        if (type === 'CONFETTI') {
            this.lifetime = 60;
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 0.5) * 8 - 2;
            this.size = Math.random() * 6 + 3;
            this.color = [Math.random() * 255, Math.random() * 255, Math.random() * 255];
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        } else if (type === 'FLAME') {
            this.lifetime = 20;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = -Math.random() * 3 - 1;
            this.size = Math.random() * 10 + 5;
            this.color = [255, Math.random() * 100 + 100, 0];
        } else {
            this.lifetime = 30;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.size = Math.random() * 4 + 2;
            this.color = [200, 200, 200];
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.age++;

        if (this.type === 'CONFETTI') {
            this.vy += 0.2; // Gravity
            this.rotation += this.rotationSpeed;
        } else if (this.type === 'FLAME') {
            this.size *= 0.9;
        }
    }

    isDead() {
        return this.age >= this.lifetime;
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        const alpha = p.map(this.age, 0, this.lifetime, 255, 0);
        
        if (this.type === 'CONFETTI') {
            p.rotate(this.rotation);
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.noStroke();
            p.rect(0, 0, this.size, this.size / 2);
        } else if (this.type === 'FLAME') {
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.noStroke();
            p.circle(0, 0, this.size);
        } else {
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.noStroke();
            p.circle(0, 0, this.size);
        }
        
        p.pop();
    }
}

export function createExplosion(x, y, count, type, gameState) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, type));
    }
}