/**
 * passenger.js
 * Simple passenger data structure and renderer.
 */

import { SHAPES, COLORS } from './globals.js';
import { setFillColor } from './utils.js';

export class Passenger {
    constructor(targetType) {
        this.targetType = targetType;
        // Visual randomness
        this.id = Math.random(); 
    }

    // Render relative to a container (station or train)
    renderAt(p, x, y) {
        p.push();
        p.translate(x, y);
        
        p.noStroke();
        setFillColor(p, COLORS.TEXT); // Passengers are dark usually
        
        const s = 5; // Size
        
        if (this.targetType === SHAPES.CIRCLE) {
            p.circle(0, 0, s);
        } else if (this.targetType === SHAPES.SQUARE) {
            p.rectMode(p.CENTER);
            p.rect(0, 0, s, s);
        } else if (this.targetType === SHAPES.TRIANGLE) {
            p.triangle(0, -s/2, s/2, s/2, -s/2, s/2);
        }
        
        p.pop();
    }
}