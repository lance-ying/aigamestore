import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body } = Matter;
import { CATEGORIES } from './globals.js';

// Base size unit for letters
const S = 30; 

/**
 * Creates a body representing a letter.
 * x, y: Spawn center position
 * char: The character 'a'-'z'
 */
export function createLetterBody(x, y, char) {
  const options = {
    label: 'letter',
    friction: 0.5,
    restitution: 0.2,
    density: 0.002,
    collisionFilter: {
      category: CATEGORIES.LETTER,
      mask: CATEGORIES.OBSTACLE | CATEGORIES.TARGET | CATEGORIES.LETTER
    }
  };

  // Determine shape based on character
  // 'o', 'O', '0' are circles for rolling mechanics
  // Others are boxes for stacking/bridging
  const lowerChar = char.toLowerCase();
  let body;
  
  if (['o', '0', 'Q', 'O'].includes(char) || char === 'c' || char === 'C') {
     // Circle approximation
     body = Bodies.circle(x, y, S/2, options);
  } else {
     // Box approximation
     // Adjust aspect ratio slightly for thin letters like 'i', 'l' vs wide 'm', 'w'
     let width = S;
     if (['i', 'l', 'j', '1', '!', '.', ',', ':'].includes(lowerChar)) {
       width = S * 0.4;
     } else if (['m', 'w'].includes(lowerChar)) {
       width = S * 1.2;
     }
     
     body = Bodies.rectangle(x, y, width, S, options);
  }

  // Attach character for rendering
  body.char = char;

  // Return as array to maintain interface compatibility
  return [body];
}