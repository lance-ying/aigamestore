import { COLORS } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'SPARK', 'TEXT', 'EXPLOSION'
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = 0.05;
        this.text = "";
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.type === 'TEXT') {
            this.vy = -1; // Float up
            this.vx = 0;
        }
    }

    render(p) {
        if (this.life <= 0) return;
        
        const alpha = this.life * 255;
        p.push();
        
        if (this.type === 'TEXT') {
            p.fill(255, 255, 255, alpha);
            p.noStroke();
            p.textSize(12);
            p.textAlign(p.CENTER);
            p.text(this.text, this.x, this.y);
        } else {
            p.stroke(COLORS.PARTICLE[0], COLORS.PARTICLE[1], COLORS.PARTICLE[2], alpha);
            p.strokeWeight(2);
            p.point(this.x, this.y);
        }
        
        p.pop();
    }
}

export function spawnDamageText(x, y, amount, entitiesList) {
    const p = new Particle(x, y, 'TEXT');
    p.text = "-" + amount;
    p.decay = 0.02;
    entitiesList.push(p);
}

export function spawnSparkEffect(x, y, count, entitiesList) {
    for(let i=0; i<count; i++) {
        entitiesList.push(new Particle(x, y, 'SPARK'));
    }
}