// Game Entities

import { Body, BoxShape } from './physics_core.js';
import { createGlyphShapes } from './glyph_data.js';
import { gameState, COLORS } from './globals.js';
import { Vec2 } from './math_utils.js';

export class LetterEntity extends Body {
    constructor(char, x, y) {
        super(x, y, false);
        this.char = char;
        
        const shapes = createGlyphShapes(char);
        shapes.forEach(s => this.addShape(s));
        
        this.color = COLORS.PLAYER_OBJ;
    }
    
    render(p) {
        p.push();
        p.translate(this.pos.x, this.pos.y);
        p.rotate(this.angle);
        
        // Debug draw shapes
        p.noFill();
        p.stroke(this.color);
        p.strokeWeight(2);
        
        // Draw the actual character for visuals
        p.push();
        p.fill(this.color);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(24);
        p.text(this.char, 0, 0);
        p.pop();
        
        // Optional: Draw physics bounds (for debugging or style)
        /*
        for(const s of this.shapes) {
            p.noFill();
            p.stroke(255, 50);
            if(s.type === 0) { // Box
                p.push();
                p.translate(s.offset.x, s.offset.y);
                p.rectMode(p.CENTER);
                p.rect(0,0, s.width, s.height);
                p.pop();
            } else { // Circle
                p.circle(s.offset.x, s.offset.y, s.radius*2);
            }
        }
        */
        p.pop();
    }
}

export class Obstacle extends Body {
    constructor(x, y, w, h, angle = 0) {
        super(x, y, true);
        this.angle = angle;
        this.addShape(new BoxShape(w, h));
        this.color = COLORS.OBSTACLE;
        this.width = w;
        this.height = h;
    }
    
    render(p) {
        p.push();
        p.translate(this.pos.x, this.pos.y);
        p.rotate(this.angle);
        p.fill(this.color);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height);
        p.pop();
    }
}

export class Target {
    constructor(x, y) {
        this.pos = new Vec2(x, y);
        this.radius = 15;
        this.collected = false;
        this.pulse = 0;
    }
    
    checkCollision(body) {
        if (this.collected) return false;
        
        // Simple check against body center/shapes
        // For game feel, check distance to body center for now
        // More accurate: check against all shapes
        
        for (const s of body.shapes) {
            const worldCenter = s.getWorldCenter(body.pos, body.angle);
            const dist = worldCenter.dist(this.pos);
            let collisionDist = this.radius;
            
            if (s.type === 1) collisionDist += s.radius; // Circle
            else collisionDist += Math.max(s.width, s.height) / 2; // Box approx
            
            if (dist < collisionDist) return true;
        }
        return false;
    }
    
    render(p) {
        if (this.collected) return;
        
        this.pulse += 0.05;
        const r = this.radius + Math.sin(this.pulse) * 3;
        
        p.push();
        p.translate(this.pos.x, this.pos.y);
        p.fill(COLORS.TARGET);
        p.noStroke();
        
        // Draw Star
        p.beginShape();
        for (let i = 0; i < 5; i++) {
            const angle = p.TWO_PI * i / 5 - p.HALF_PI;
            const sx = Math.cos(angle) * r;
            const sy = Math.sin(angle) * r;
            p.vertex(sx, sy);
            
            const angle2 = p.TWO_PI * (i + 0.5) / 5 - p.HALF_PI;
            const sx2 = Math.cos(angle2) * (r * 0.5);
            const sy2 = Math.sin(angle2) * (r * 0.5);
            p.vertex(sx2, sy2);
        }
        p.endShape(p.CLOSE);
        p.pop();
    }
}