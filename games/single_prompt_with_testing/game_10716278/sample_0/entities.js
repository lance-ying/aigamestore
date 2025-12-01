import { gameState, COLORS, NOTE_SIZE, LANE_WIDTH, CANVAS_WIDTH, CANVAS_HEIGHT, NOTE_LEFT, NOTE_DOWN, NOTE_UP, NOTE_RIGHT } from './globals.js';
import { drawArrow } from './drawing.js';

export class Note {
    constructor(type, timestamp, isEnemy = false) {
        this.type = type; // 0-3
        this.timestamp = timestamp; // When it should be hit (ms)
        this.isEnemy = isEnemy;
        
        this.hit = false;
        this.missed = false;
        this.y = 1000; // Initialize off screen
        
        // Visual
        this.sustain = 0; // Length of sustain note (0 for single hit)
    }
    
    update(currentTime, scrollSpeed) {
        // Calculate Y position based on time difference from hit time
        // If currentTime == timestamp, y should be RECEPTOR_Y
        // Note moves UP.
        // timeDifference > 0 means note is late (above receptor)
        // timeDifference < 0 means note is early (below receptor)
        
        const timeDiff = this.timestamp - currentTime;
        // distance = speed * time
        // We want speed in pixels/ms ideally, but scrollSpeed is pixels/frame approx.
        // Let's assume 60fps.
        const PIXELS_PER_MS = scrollSpeed * 0.06; 
        
        // RECEPTOR_Y is top (e.g. 50).
        // Positive timeDiff (future) -> Y > 50 (lower on screen)
        this.y = 50 + (timeDiff * PIXELS_PER_MS);
    }
    
    render(p) {
        if (this.hit) return; // Don't draw if hit
        
        // Determine X pos based on lane and ownership
        // Enemy lanes: Left side (0-3)
        // Player lanes: Right side (4-7 logic)
        
        let laneOffset = this.isEnemy ? 50 : CANVAS_WIDTH - (LANE_WIDTH * 4) - 50;
        let x = laneOffset + (this.type * LANE_WIDTH) + (LANE_WIDTH / 2);
        
        drawArrow(p, this.type, x, this.y, NOTE_SIZE);
    }
}

export class Character {
    constructor(x, y, isPlayer, characterType = 'bf') {
        this.x = x;
        this.y = y;
        this.isPlayer = isPlayer;
        this.type = characterType; // 'bf', 'dad', 'gf'
        this.scale = 1;
        if (characterType === 'dad') this.scale = 1.2;
        
        this.animState = 'idle'; // idle, left, right, up, down, miss
        this.animTimer = 0;
    }
    
    playAnim(anim) {
        this.animState = anim;
        this.animTimer = 20; // Frames to hold pose
    }
    
    update() {
        if (this.animTimer > 0) {
            this.animTimer--;
        } else {
            this.animState = 'idle';
        }
        
        // Bop to the beat
        if (Math.abs(gameState.currentBeat % 1) < 0.1 && this.animState === 'idle') {
            // Tiny squash/stretch effect could go here
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.scale(this.isPlayer ? -1 : 1, 1); // Flip player to face left
        p.scale(this.scale);
        
        // Bobbing effect
        let bobY = 0;
        if (this.animState === 'idle') {
            // Bob every beat
            const beatPhase = (gameState.songTime / 1000) * (gameState.bpm / 60);
            bobY = Math.abs(p.sin(beatPhase * p.PI)) * 5;
        }
        
        p.translate(0, bobY);
        
        // Draw Character based on Type
        if (this.type === 'bf') this.drawBoyfriend(p);
        else if (this.type === 'dad') this.drawDad(p);
        else if (this.type === 'gf') this.drawGF(p);
        
        p.pop();
    }
    
    drawBoyfriend(p) {
        // Body
        p.fill(255); // White shirt
        p.rect(-20, -50, 40, 50, 5);
        
        // Pants
        p.fill(50, 100, 200); // Blue pants
        p.rect(-20, 0, 40, 40, 5);
        
        // Head
        p.fill(255, 220, 180); // Skin
        p.circle(0, -70, 50);
        
        // Cap (Red)
        p.fill(255, 50, 50);
        p.arc(0, -75, 52, 50, p.PI, 0); // Cap dome
        p.rect(0, -75, 40, 10); // Visor
        
        // Hair (Cyan)
        p.fill(50, 200, 255);
        p.circle(-20, -75, 15); // Side poof
        
        // Face
        p.fill(0);
        if (this.animState === 'miss') {
            p.textSize(20);
            p.text('X  X', 0, -70); // Dead eyes
        } else {
            // Eyes
            p.circle(5, -75, 5);
            p.circle(20, -75, 5);
        }
        
        // Arms/Mic
        p.fill(255, 220, 180);
        if (this.animState === 'up') p.rect(20, -90, 10, 40); // Arm up
        else if (this.animState === 'left') p.rect(20, -50, 30, 10); // Arm fwd
        else p.rect(15, -40, 10, 30); // Idle arm
        
        // Mic
        p.fill(50);
        p.circle(25, -50, 12);
    }
    
    drawDad(p) {
        // Suit
        p.fill(150, 50, 150); // Purple suit
        p.rect(-30, -80, 60, 80, 5);
        
        // Pants
        p.fill(100, 30, 100);
        p.rect(-30, 0, 60, 60);
        
        // Head
        p.fill(200, 180, 255); // Pale purple skin
        p.circle(0, -100, 60);
        
        // Hair
        p.fill(50, 0, 50); // Dark hair
        p.arc(0, -110, 70, 60, p.PI, 0);
        
        // Face
        p.fill(0);
        p.circle(-10, -105, 5);
        p.circle(10, -105, 5); // Eyes
        
        // Evil grin
        p.noFill();
        p.stroke(0);
        p.strokeWeight(2);
        p.arc(0, -90, 30, 20, 0, p.PI);
    }
    
    drawGF(p) {
        // Speakers (Background prop really, but attached to GF)
        p.fill(30);
        p.rect(-60, 0, 120, 60); // Main box
        p.fill(50);
        p.circle(-30, 30, 40);
        p.circle(30, 30, 40);
        
        // Dress
        p.fill(200, 50, 50);
        p.triangle(0, -50, -30, 10, 30, 10);
        
        // Head
        p.fill(255, 220, 180);
        p.circle(0, -60, 45);
        
        // Hair (Auburn)
        p.fill(150, 50, 30);
        p.arc(0, -65, 55, 60, p.PI, 0);
        p.rect(-28, -65, 56, 40); // Long hair down
    }
}

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.lifetime = 20;
        this.color = color;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
    }
    
    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], (this.lifetime/20) * 255);
        p.circle(this.x, this.y, 8);
    }
}