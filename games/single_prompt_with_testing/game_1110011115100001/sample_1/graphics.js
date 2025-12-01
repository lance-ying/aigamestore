// Helper functions to mimic ASCII/Vector art style
import { COLORS } from './globals.js';

export function drawVectorChar(p, x, y, charType, color = [255, 255, 255], scale = 1) {
    p.push();
    p.translate(x, y);
    p.scale(scale);
    p.stroke(color);
    p.strokeWeight(2);
    p.noFill();

    switch(charType) {
        case 'PLAYER_IDLE':
            // Draw a stick figure-ish 'O' with legs
            p.rect(-5, -15, 10, 10); // Head
            p.line(0, -5, 0, 5); // Body
            p.line(0, 5, -5, 15); // Left Leg
            p.line(0, 5, 5, 15); // Right Leg
            p.line(0, -2, -6, 2); // Left Arm
            p.line(0, -2, 6, 2); // Right Arm
            break;
            
        case 'PLAYER_ATTACK':
            p.rect(-5, -15, 10, 10);
            p.line(0, -5, 0, 5);
            p.line(0, 5, -5, 15);
            p.line(0, 5, 8, 12); // Right Leg forward
            p.line(0, -2, -4, 0); 
            p.line(0, -2, 12, 0); // Arm extended
            p.line(12, -8, 12, 8); // Sword vertical
            break;

        case 'ENEMY':
            // Spiky shape
            p.beginShape();
            p.vertex(-10, 10);
            p.vertex(-5, 0);
            p.vertex(-10, -10);
            p.vertex(0, -5);
            p.vertex(10, -10);
            p.vertex(5, 0);
            p.vertex(10, 10);
            p.vertex(0, 5);
            p.endShape(p.CLOSE);
            // Evil eyes
            p.line(-4, -2, -2, -4);
            p.line(2, -4, 4, -2);
            break;

        case 'STONE':
            // Diamond shape
            p.stroke(COLORS.STONE);
            p.beginShape();
            p.vertex(0, -10);
            p.vertex(8, 0);
            p.vertex(0, 10);
            p.vertex(-8, 0);
            p.endShape(p.CLOSE);
            // Inner shine
            p.line(-2, -2, 2, 2);
            break;
            
        case 'GROUND_GRASS':
            // Little tuft
            p.line(-5, 0, -3, -5);
            p.line(-3, -5, 0, 0);
            p.line(0, 0, 3, -4);
            p.line(3, -4, 5, 0);
            break;

        case 'BLOCK':
            // Brick pattern
            p.rect(-15, -10, 30, 20);
            p.line(-15, 0, 15, 0);
            p.line(0, -10, 0, 0);
            p.line(-7, 0, -7, 10);
            p.line(7, 0, 7, 10);
            break;
    }
    p.pop();
}

export function drawSwordSlash(p, x, y, facing) {
    p.push();
    p.translate(x, y);
    p.scale(facing, 1);
    p.stroke(255, 255, 200);
    p.strokeWeight(3);
    p.noFill();
    p.arc(20, 0, 40, 60, -p.PI/3, p.PI/3);
    p.pop();
}