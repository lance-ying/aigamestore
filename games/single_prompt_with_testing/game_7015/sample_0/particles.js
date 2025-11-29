export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 30;
        this.maxLife = 30;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.size *= 0.9; // Shrink
    }

    render(p) {
        p.noStroke();
        let alpha = p.map(this.life, 0, this.maxLife, 0, 255);
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.circle(this.x, this.y, this.size);
    }
}

export class ParticleSystem {
    constructor(x, y, color, count) {
        this.particles = [];
        for(let i=0; i<count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    update() {
        for(let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if(this.particles[i].life <= 0) {
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