import { CANVAS_WIDTH } from './globals.js';

/**
 * Utility functions for drawing and calculations.
 */

// Draw wrapped text inside a box
export function drawTextWrapped(p, text, x, y, maxWidth, lineHeight) {
    let words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = p.textWidth(testLine);
        if (metrics > maxWidth && n > 0) {
            p.text(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    p.text(line, x, currentY);
    return currentY + lineHeight; // Return next Y
}

// Check mouse hover (helper for potential mouse support extensions, used for layout logic)
export function isMouseOver(p, x, y, w, h) {
    return p.mouseX > x && p.mouseX < x + w && p.mouseY > y && p.mouseY < y + h;
}

// Shuffle array in place
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Ease out cubic
export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Create a unique ID
export function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}