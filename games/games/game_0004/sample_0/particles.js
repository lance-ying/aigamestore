// particles.js
// Visual effects

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'dust', 'sparkle', 'puff'
        this.age = 0;
        this.lifetime = 60;
        
        if (type === 'dust') {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 1 - 1;
            this.size = Math.random() * 4 + 2;
            this.color = [150, 150, 150];
            this.lifetime = 30;
        } else if (type === 'sparkle') {
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = (Math.random() - 0.5) * 3;
            this.size = Math.random() * 3 + 1;
            this.color = [255, 215, 0];
            this.lifetime = 45;
        } else if (type === 'puff') {
            this.vx = 0;
            this.vy = 0;
            this.size = Math.random() * 10 + 5;
            this.color = [255, 255, 255];
            this.lifetime = 20;
            this.growth = 1;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.age++;

        if (this.type === 'dust') {
            this.vy += 0.05; // Light gravity
            this.size *= 0.95;
        } else if (this.type === 'puff') {
            this.size += this.growth;
            this.color[3] = 255 * (1 - this.age/this.lifetime);
        }
    }

    isDead() {
        return this.age >= this.lifetime || this.size < 0.1;
    }

    render(p) {
        let alpha = 255 * (1 - this.age / this.lifetime);
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.circle(this.x, this.y, this.size);
    }
}