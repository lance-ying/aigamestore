/**
 * Particle System for effects
 */

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.alpha = 255;
        this.color = color;
        this.size = Math.random() * 6 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity
        this.alpha -= 5;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
        p.circle(this.x, this.y, this.size);
    }
}

export class ParticleSystem {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.particles = [];
        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(p) {
        this.particles.forEach(pt => pt.render(p));
    }
    
    isDead() {
        return this.particles.length === 0;
    }
}