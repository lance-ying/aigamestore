import { NOTE_LEFT, NOTE_DOWN, NOTE_UP, NOTE_RIGHT, NOTE_SIZE, COLORS } from './globals.js';

// Helper to draw specific arrow shapes
export function drawArrow(p, type, x, y, size, colorOverride = null, stroke = true) {
    const half = size / 2;
    const c = colorOverride || getColorForNote(type);
    
    p.push();
    p.translate(x, y);
    
    if (stroke) {
        p.stroke(255);
        p.strokeWeight(3);
    } else {
        p.noStroke();
    }
    
    p.fill(c);
    
    // Rotate based on type
    let angle = 0;
    if (type === NOTE_LEFT) angle = -p.PI / 2;
    if (type === NOTE_DOWN) angle = p.PI;
    if (type === NOTE_UP) angle = 0;
    if (type === NOTE_RIGHT) angle = p.PI / 2;
    
    p.rotate(angle);
    
    // Draw generic arrow shape pointing UP (0 rotation)
    p.beginShape();
    p.vertex(0, -half);           // Tip
    p.vertex(half, 0);            // Right wing top
    p.vertex(half * 0.4, 0);      // Right stem start
    p.vertex(half * 0.4, half);   // Right stem bottom
    p.vertex(-half * 0.4, half);  // Left stem bottom
    p.vertex(-half * 0.4, 0);     // Left stem start
    p.vertex(-half, 0);           // Left wing top
    p.endShape(p.CLOSE);
    
    // Inner detail (optional for style)
    p.noStroke();
    p.fill(255, 255, 255, 100);
    p.circle(0, 0, size * 0.3);

    p.pop();
}

// Helper to draw the receptor (gray outline)
export function drawReceptor(p, type, x, y, size, isPressed) {
    const half = size / 2;
    
    p.push();
    p.translate(x, y);
    
    // Glow effect if pressed
    if (isPressed) {
        const c = getColorForNote(type);
        p.noStroke();
        p.fill(c[0], c[1], c[2], 100);
        p.circle(0, 0, size * 1.5);
        p.fill(c);
    } else {
        p.noFill();
    }
    
    p.stroke(200);
    p.strokeWeight(isPressed ? 0 : 3);
    
    // Rotation logic same as arrow
    let angle = 0;
    if (type === NOTE_LEFT) angle = -p.PI / 2;
    if (type === NOTE_DOWN) angle = p.PI;
    if (type === NOTE_UP) angle = 0;
    if (type === NOTE_RIGHT) angle = p.PI / 2;
    
    p.rotate(angle);
    
    p.beginShape();
    p.vertex(0, -half);
    p.vertex(half, 0);
    p.vertex(half * 0.4, 0);
    p.vertex(half * 0.4, half);
    p.vertex(-half * 0.4, half);
    p.vertex(-half * 0.4, 0);
    p.vertex(-half, 0);
    p.endShape(p.CLOSE);
    
    // Inner receptor detail
    if (!isPressed) {
        p.fill(100, 100, 100, 100);
        p.circle(0, 0, size * 0.4);
    }

    p.pop();
}

function getColorForNote(type) {
    switch (type) {
        case NOTE_LEFT: return COLORS.PURPLE;
        case NOTE_DOWN: return COLORS.BLUE;
        case NOTE_UP: return COLORS.GREEN;
        case NOTE_RIGHT: return COLORS.RED;
        default: return COLORS.WHITE;
    }
}