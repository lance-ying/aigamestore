import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, Composite } = Matter;
import { CATEGORIES } from './globals.js';

// Base size unit for letters
const S = 30; // Scale factor
const W = 5;  // Stroke width for physics bodies

/**
 * Creates a compound body representing a letter.
 * x, y: Spawn center position
 * char: The character 'a'-'z'
 */
export function createLetterBody(x, y, char) {
  const options = {
    label: 'letter',
    friction: 0.5,
    restitution: 0.2, // Low bounce
    density: 0.002,
    collisionFilter: {
      category: CATEGORIES.LETTER,
      mask: CATEGORIES.OBSTACLE | CATEGORIES.TARGET | CATEGORIES.LETTER
    },
    render: { visible: false } // We render manually
  };

  const parts = getLetterParts(x, y, char);
  
  if (!parts || parts.length === 0) {
    // Fallback block for unknown chars
    return Bodies.rectangle(x, y, S, S, options);
  }

  // If it's a single part, just return it (wrapping in array check inside Body.create logic handled by Matter?)
  // Actually Body.create with parts automatically calculates hull.
  // For 'i' and 'j', we might want separate bodies (dot separate), but to simplify, we can attach them or just return a composite?
  // Game design choice: Let's make dots separate bodies for fun! 
  // Function returns ARRAY of bodies.
  
  return parts.map(p => {
    // If the part is a config object for Bodies.rectangle/circle, create it
    // But getLetterParts will return actual Bodies to allow complex positioning
    // We need to reset their position relative to (x,y)
    return p;
  });
}

// Helper to create parts. Returns Array of Matter Bodies.
function getLetterParts(cx, cy, char) {
  const bodies = [];
  const common = { friction: 0.5, restitution: 0.2, density: 0.002, label: 'letter' };
  
  // Offset helpers
  const box = (x, y, w, h) => Bodies.rectangle(cx + x, cy + y, w, h, common);
  const circ = (x, y, r) => Bodies.circle(cx + x, cy + y, r, common);

  switch(char.toLowerCase()) {
    case 'a':
      bodies.push(circ(0, S/4, S/2)); // Loop
      bodies.push(box(S/2, S/4, W, S)); // Stick
      break;
    case 'b':
      bodies.push(box(-S/3, 0, W, S*1.5)); // Left Stick
      bodies.push(circ(S/6, S/4, S/2.2)); // Bottom Loop
      break;
    case 'c':
      // Approximate C with 3 rects
      bodies.push(box(0, -S/2, S, W)); // Top
      bodies.push(box(-S/2, 0, W, S)); // Left
      bodies.push(box(0, S/2, S, W)); // Bottom
      break;
    case 'd':
      bodies.push(circ(-S/6, S/4, S/2.2)); // Bottom Loop
      bodies.push(box(S/3, -S/4, W, S*1.5)); // Right Stick
      break;
    case 'e':
      bodies.push(box(-S/4, 0, W, S)); // Back
      bodies.push(box(0, -S/2, S, W)); // Top
      bodies.push(box(0, 0, S, W)); // Middle
      bodies.push(box(0, S/2, S, W)); // Bottom
      break;
    case 'f':
      bodies.push(box(-S/4, 0, W, S*1.5)); // Vertical
      bodies.push(box(S/4, -S/1.5, S/1.5, W)); // Top
      bodies.push(box(S/4, -S/4, S/1.5, W)); // Middle
      break;
    case 'g':
      bodies.push(circ(0, -S/4, S/2.2)); // Top Loop
      bodies.push(box(S/2, 0, W, S*1.5)); // Right descender
      bodies.push(box(0, S/1.5, S, W)); // Bottom hook
      break;
    case 'h':
      bodies.push(box(-S/3, -S/4, W, S*1.5)); // Left
      bodies.push(box(S/3, 0, W, S)); // Right
      bodies.push(box(0, -S/4, S, W)); // Cross
      break;
    case 'i':
      // Dot is separate!
      bodies.push(box(0, S/4, W, S)); // Stick
      bodies.push(circ(0, -S/1.5, W)); // Dot (separate body)
      break;
    case 'j':
      bodies.push(box(S/4, 0, W, S*1.5)); // Stick
      bodies.push(box(0, S/1.5, S/2, W)); // Hook
      bodies.push(circ(S/4, -S/1.5, W)); // Dot
      break;
    case 'k':
      bodies.push(box(-S/3, 0, W, S*1.5)); // Stick
      bodies.push(Bodies.fromVertices(cx + S/6, cy - S/4, [
        {x: 0, y: 0}, {x: S/2, y: -S/2}, {x: 0, y: S/2}
      ], common)); // Top branch (simplified)
       bodies.push(Bodies.fromVertices(cx + S/6, cy + S/4, [
        {x: 0, y: 0}, {x: S/2, y: S/2}, {x: 0, y: -S/2}
      ], common)); // Bottom branch
      break;
    case 'l':
      bodies.push(box(0, -S/4, W, S*1.5)); // Just a stick
      break;
    case 'm':
      bodies.push(box(-S/2, 0, W, S));
      bodies.push(box(0, 0, W, S));
      bodies.push(box(S/2, 0, W, S));
      bodies.push(box(-S/4, -S/2, S/2, W));
      bodies.push(box(S/4, -S/2, S/2, W));
      break;
    case 'n':
      bodies.push(box(-S/3, 0, W, S));
      bodies.push(box(S/3, 0, W, S));
      bodies.push(box(0, -S/2, S, W));
      break;
    case 'o':
      bodies.push(circ(0, 0, S/2));
      break;
    case 'p':
      bodies.push(box(-S/3, S/4, W, S*1.5)); // Stick down
      bodies.push(circ(S/6, -S/4, S/2.2)); // Loop up
      break;
    case 'q':
      bodies.push(circ(-S/6, -S/4, S/2.2)); // Loop up
      bodies.push(box(S/3, S/4, W, S*1.5)); // Stick down
      break;
    case 'r':
      bodies.push(box(-S/4, 0, W, S));
      bodies.push(box(S/4, -S/2, S/1.5, W));
      break;
    case 's':
      bodies.push(circ(0, -S/4, S/3)); // Top
      bodies.push(circ(0, S/4, S/3)); // Bottom
      // S is hard, two circles slightly offset?
      // Or 3 rects zigzag
      break;
    case 't':
      bodies.push(box(0, 0, W, S*1.2));
      bodies.push(box(0, -S/4, S, W));
      break;
    case 'u':
      bodies.push(box(-S/3, -S/4, W, S));
      bodies.push(box(S/3, -S/4, W, S));
      bodies.push(box(0, S/4, S, W));
      break;
    case 'v':
      // V shape from vertices
      const vShape = Bodies.fromVertices(cx, cy, [
        {x: -S/2, y: -S/2}, {x: 0, y: S/2}, {x: S/2, y: -S/2},
        {x: S/2-W, y: -S/2}, {x: 0, y: S/2-W}, {x: -S/2+W, y: -S/2}
      ], common);
      if(vShape) bodies.push(vShape);
      else bodies.push(box(0,0,S,S)); // Fallback
      break;
    case 'w':
      bodies.push(box(-S/2, 0, W, S));
      bodies.push(box(0, 0, W, S));
      bodies.push(box(S/2, 0, W, S));
      bodies.push(box(-S/4, S/2, S/2, W));
      bodies.push(box(S/4, S/2, S/2, W));
      break;
    case 'x':
      // Cross
      const x1 = box(0, 0, W, S*1.2);
      Body.rotate(x1, Math.PI/4);
      const x2 = box(0, 0, W, S*1.2);
      Body.rotate(x2, -Math.PI/4);
      bodies.push(x1);
      bodies.push(x2);
      break;
    case 'y':
      bodies.push(box(-S/4, -S/2, W, S/1.5)); // Left arm
      bodies.push(box(S/4, -S/2, W, S/1.5)); // Right arm
      // Rotate them slightly in join? Keeping simple for robustness
      bodies.push(box(0, S/4, W, S)); // Stem
      break;
    case 'z':
      bodies.push(box(0, -S/2, S, W));
      bodies.push(box(0, S/2, S, W));
      const diag = box(0, 0, W, S*1.2);
      Body.rotate(diag, -Math.PI/4);
      bodies.push(diag);
      break;
    default:
      bodies.push(box(0, 0, S, S)); // Box
  }

  // Before returning, if there are multiple parts that should be ONE body (not i, j), join them.
  // Exception: i, j, x (cross) might be better as compound.
  // Matter.Body.create({ parts: [...] }) creates a single rigid body from parts.
  
  const singleBodyChars = ['i', 'j', '!', '?', ':']; 
  if (singleBodyChars.includes(char.toLowerCase())) {
     // Return the array of separate bodies (e.g. dot and stick fall separately)
     return bodies;
  } else {
     // Create a single compound body
     if (bodies.length === 1) return [bodies[0]];
     
     // Note: Body.create with parts modifies the parts positions relative to the new center.
     // This can be tricky.
     // For this game, it's safer to return separate bodies if we don't strictly need them rigid, 
     // BUT we want letters like 'o' or 'd' to hold together.
     
     const compound = Body.create({
       parts: bodies,
       label: 'letter',
       friction: 0.5,
       restitution: 0.2,
       density: 0.002
     });
     
     // Reset position because compound body centers itself at (0,0) of parts?
     // Matter.js recenters the body. We need to move it back to cx, cy?
     // Actually, if we created parts at absolute world coords, the compound body is created there.
     // We don't need to force position again unless it shifted.
     
     return [compound];
  }
}