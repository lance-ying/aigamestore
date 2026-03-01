// Glyph Definitions for Letter Physics
// Maps characters to physics shapes

import { BoxShape, CircleShape } from './physics_core.js';

export function createGlyphShapes(char) {
    const shapes = [];
    const c = char.toLowerCase();
    
    // Standard size unit
    const S = 20; 
    
    switch(c) {
        case 'o':
            shapes.push(new CircleShape(S/2, 0, 0));
            break;
        case 'l':
        case 'i':
            shapes.push(new BoxShape(S/3, S*1.5, 0, 0));
            break;
        case '.':
            shapes.push(new BoxShape(S/3, S/3, 0, S/2));
            break;
        case '-':
        case '_':
            shapes.push(new BoxShape(S*2, S/4, 0, 0));
            break;
        case 'm':
        case 'w':
            shapes.push(new BoxShape(S*1.5, S, 0, 0));
            break;
        case 'p':
            // Vertical stem on left
            shapes.push(new BoxShape(S/3, S*1.5, -S/3, S/4)); 
            // Loop on top right
            shapes.push(new CircleShape(S/2, S/4, -S/4));
            break;
        case 'q':
             // Vertical stem on right
            shapes.push(new BoxShape(S/3, S*1.5, S/3, S/4));
             // Loop on top left
            shapes.push(new CircleShape(S/2, -S/4, -S/4));
            break;
        case 'b':
             // Vertical stem left
            shapes.push(new BoxShape(S/3, S*1.5, -S/3, -S/4));
             // Loop bottom right
            shapes.push(new CircleShape(S/2, S/4, S/4));
            break;
        case 'd':
             // Vertical stem right
            shapes.push(new BoxShape(S/3, S*1.5, S/3, -S/4));
             // Loop bottom left
            shapes.push(new CircleShape(S/2, -S/4, S/4));
            break;
        case 'a':
            shapes.push(new CircleShape(S/2, 0, S/4));
            shapes.push(new BoxShape(S/4, S, S/2, S/4));
            break;
        default:
            // Generic Box for unknown chars
            shapes.push(new BoxShape(S, S, 0, 0));
            break;
    }
    return shapes;
}