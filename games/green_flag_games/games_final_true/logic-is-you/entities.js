import { gameState, TILE_SIZE } from './globals.js';
import { TYPE_CONFIG } from './types.js';

let nextId = 0;

export class Entity {
    constructor(x, y, type) {
        this.id = nextId++;
        this.x = x; // Grid X
        this.y = y; // Grid Y
        this.type = type;
        this.facing = 1; // 1 Right, 2 Down, 3 Left, 0 Up
        this.dead = false;
        
        // Visuals
        this.animOffset = Math.random() * 100;
        this.moveLerpX = x * TILE_SIZE;
        this.moveLerpY = y * TILE_SIZE;
    }
    
    update(p) {
        // Smooth movement interpolation
        const targetX = this.x * TILE_SIZE;
        const targetY = this.y * TILE_SIZE;
        
        this.moveLerpX = p.lerp(this.moveLerpX, targetX, 0.4);
        this.moveLerpY = p.lerp(this.moveLerpY, targetY, 0.4);
    }
    
    render(p) {
        if (this.dead) return;
        
        // Basic rendering dispatch
        const cx = this.moveLerpX + TILE_SIZE / 2;
        const cy = this.moveLerpY + TILE_SIZE / 2;
        const config = TYPE_CONFIG[this.type];
        
        if (!config) return;

        p.push();
        p.translate(cx, cy);
        
        // Minimal Wobble effect (Reduced amplitude)
        const wobbleX = p.sin(p.frameCount * 0.05 + this.animOffset) * 0.5;
        const wobbleY = p.cos(p.frameCount * 0.06 + this.animOffset) * 0.5;
        const scaleW = 1 + p.sin(p.frameCount * 0.08 + this.animOffset) * 0.02;
        const scaleH = 1 + p.cos(p.frameCount * 0.08 + this.animOffset) * 0.02;
        
        p.translate(wobbleX, wobbleY);
        p.scale(scaleW, scaleH);
        
        // Draw logic based on type
        if (config.isText) {
            this.renderText(p, config.color);
        } else {
            this.renderObject(p, config.color);
        }
        
        p.pop();
    }
    
    renderText(p, color) {
        p.rectMode(p.CENTER);
        p.noStroke();
        p.fill(color[0], color[1], color[2]);
        p.rect(0, 0, TILE_SIZE - 2, TILE_SIZE - 2, 4);
        
        p.fill(0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(10);
        p.textStyle(p.BOLD);
        p.text(getTextLabel(this.type), 0, 0);
    }
    
    renderObject(p, color) {
        p.fill(color[0], color[1], color[2]);
        p.noStroke();
        
        switch (this.type) {
            case 'BABA':
                this.drawBaba(p);
                break;
            case 'FLAG':
                this.drawFlag(p);
                break;
            case 'WALL':
                p.rectMode(p.CENTER);
                p.rect(0, 0, TILE_SIZE, TILE_SIZE);
                // Bricks detail
                p.stroke(0, 50);
                p.line(-10, 0, 10, 0);
                p.line(0, -10, 0, 10);
                break;
            case 'ROCK':
                p.rectMode(p.CENTER);
                p.rect(0, 0, TILE_SIZE - 4, TILE_SIZE - 4, 5);
                break;
            case 'WATER':
                p.fill(color[0], color[1], color[2], 200);
                p.rectMode(p.CENTER);
                p.rect(0, 0, TILE_SIZE, TILE_SIZE);
                p.fill(255, 100);
                p.circle(-5, -5, 5);
                p.circle(5, 5, 3);
                break;
            case 'SKULL':
                this.drawSkull(p);
                break;
            case 'GRASS':
                p.noFill();
                p.stroke(color[0], color[1], color[2]);
                p.strokeWeight(2);
                p.line(-5, 8, -8, 0);
                p.line(0, 8, 0, -4);
                p.line(5, 8, 8, -2);
                break;
            default:
                p.rectMode(p.CENTER);
                p.rect(0, 0, TILE_SIZE - 4, TILE_SIZE - 4);
        }
    }
    
    drawBaba(p) {
        p.fill(255);
        p.noStroke();
        // Body
        p.ellipse(0, 4, 20, 14);
        // Ears
        p.push();
        p.rotate(-0.2);
        p.ellipse(-6, -8, 6, 14);
        p.pop();
        p.push();
        p.rotate(0.2);
        p.ellipse(6, -8, 6, 14);
        p.pop();
        // Eyes
        p.fill(0);
        let lookX = 0;
        if(this.facing === 1) lookX = 2;
        if(this.facing === 3) lookX = -2;
        p.circle(-4 + lookX, -2, 3);
        p.circle(4 + lookX, -2, 3);
    }
    
    drawFlag(p) {
        p.stroke(255);
        p.strokeWeight(2);
        p.line(-6, 10, -6, -8); // Pole
        p.fill(255, 255, 0);
        p.noStroke();
        p.triangle(-6, -8, 8, -3, -6, 2); // Flag part
    }
    
    drawSkull(p) {
        p.fill(200, 50, 50);
        p.ellipse(0, 0, 18, 18); // Head
        p.rectMode(p.CENTER);
        p.rect(0, 8, 10, 6); // Jaw
        p.fill(0);
        p.circle(-4, 0, 5); // Eyes
        p.circle(4, 0, 5);
    }
}

function getTextLabel(type) {
    return type.replace('TEXT_', '');
}