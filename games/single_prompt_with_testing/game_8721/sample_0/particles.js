/**
 * particles.js
 * Visual effects system.
 */

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.age = 0;
        
        // Define properties based on type
        switch(type) {
            case 'DUST':
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = (Math.random() * -1) - 1;
                this.life = 20;
                this.size = Math.random() * 5 + 3;
                this.color = [200, 200, 200, 150];
                this.gravity = 0;
                break;
            case 'SPARKLE':
                this.vx = 0;
                this.vy = -1;
                this.life = 30;
                this.size = 8;
                this.color = [255, 255, 0, 200];
                this.gravity = 0;
                break;
            case 'DEBRIS':
                this.vx = (Math.random() - 0.5) * 6;
                this.vy = (Math.random() * -5) - 3;
                this.life = 60;
                this.size = 8;
                this.color = [139, 69, 19, 255];
                this.gravity = 0.4;
                break;
            case 'TEXT':
                this.vx = 0;
                this.vy = -1;
                this.life = 40;
                this.size = 14;
                this.text = "+100";
                this.color = [255, 255, 255, 255];
                this.gravity = 0;
                break;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.age++;

        if (this.age > this.life) {
            this.active = false;
        }
    }

    render(p) {
        p.push();
        if (this.type === 'TEXT') {
            p.fill(this.color);
            p.noStroke();
            p.textAlign(p.CENTER);
            p.textSize(this.size);
            p.text(this.text, this.x, this.y);
        } else {
            // Fade out
            const alpha = p.map(this.age, 0, this.life, this.color[3] || 255, 0);
            p.fill(this.color[0], this.color[1], this.color[2], alpha);
            p.noStroke();
            p.circle(this.x, this.y, this.size);
        }
        p.pop();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    spawn(x, y, type, count = 1, options = {}) {
        for (let i = 0; i < count; i++) {
            const p = new Particle(x, y, type);
            if (options.text) p.text = options.text;
            if (options.color) p.color = options.color;
            this.particles.push(p);
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (!this.particles[i].active) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(p) {
        this.particles.forEach(pt => pt.render(p));
    }
}