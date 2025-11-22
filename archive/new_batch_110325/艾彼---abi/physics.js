// physics.js - Collision detection and physics
import { gameState } from './globals.js';

export function checkCollision(obj1, obj2) {
  if (!obj1 || !obj2) return false;
  
  const b1 = obj1.getBounds();
  const b2 = obj2.getBounds();
  
  if (!b1 || !b2) return false;
  
  return !(b1.right < b2.left || 
           b1.left > b2.right || 
           b1.bottom < b2.top || 
           b1.top > b2.bottom);
}

export function checkPointInBounds(x, y, bounds) {
  if (!bounds) return false;
  return x >= bounds.left && x <= bounds.right && 
         y >= bounds.top && y <= bounds.bottom;
}

export function canMove(character, dx, dy, gameState) {
  const newX = character.x + dx;
  const newY = character.y + dy;
  
  const testBounds = {
    left: newX - character.width / 2,
    right: newX + character.width / 2,
    top: newY - character.height / 2,
    bottom: newY + character.height / 2
  };
  
  // World boundaries
  if (testBounds.left < 0 || testBounds.right > gameState.worldWidth ||
      testBounds.top < 0 || testBounds.bottom > gameState.worldHeight) {
    return false;
  }
  
  // Check collision with walls
  for (const wall of gameState.walls) {
    const wallBounds = wall.getBounds();
    if (checkPointInBounds(testBounds.left, testBounds.top, wallBounds) ||
        checkPointInBounds(testBounds.right, testBounds.top, wallBounds) ||
        checkPointInBounds(testBounds.left, testBounds.bottom, wallBounds) ||
        checkPointInBounds(testBounds.right, testBounds.bottom, wallBounds) ||
        checkPointInBounds(testBounds.left, testBounds.top + character.height/2, wallBounds) ||
        checkPointInBounds(testBounds.right, testBounds.top + character.height/2, wallBounds)) {
      return false;
    }
  }
  
  // Check collision with crates
  for (const crate of gameState.crates) {
    const crateBounds = crate.getBounds();
    if (checkPointInBounds(testBounds.left, testBounds.top, crateBounds) ||
        checkPointInBounds(testBounds.right, testBounds.top, crateBounds) ||
        checkPointInBounds(testBounds.left, testBounds.bottom, crateBounds) ||
        checkPointInBounds(testBounds.right, testBounds.bottom, crateBounds)) {
      return false;
    }
  }
  
  // Check collision with doors
  for (const door of gameState.doors) {
    const doorBounds = door.getBounds();
    if (doorBounds) {
      if (checkPointInBounds(testBounds.left, testBounds.top, doorBounds) ||
          checkPointInBounds(testBounds.right, testBounds.top, doorBounds) ||
          checkPointInBounds(testBounds.left, testBounds.bottom, doorBounds) ||
          checkPointInBounds(testBounds.right, testBounds.bottom, doorBounds)) {
        return false;
      }
    }
  }
  
  // Check tight spaces (only Abi can enter)
  if (gameState.tightSpaces) {
    for (const space of gameState.tightSpaces) {
      const spaceBounds = space.getBounds();
      const inSpace = checkPointInBounds(newX, newY, spaceBounds);
      if (inSpace && !space.canEnter(character)) {
        return false;
      }
    }
  }
  
  return true;
}

export function getInteractableObject(character, gameState) {
  const interactRange = 50;
  
  // Check switches
  for (const sw of gameState.switches) {
    const dist = Math.hypot(character.x - sw.x, character.y - sw.y);
    if (dist < interactRange) {
      return { type: 'switch', object: sw };
    }
  }
  
  // Check terminals
  for (const terminal of gameState.terminals) {
    const dist = Math.hypot(character.x - terminal.x, character.y - terminal.y);
    if (dist < interactRange && !terminal.activated) {
      return { type: 'terminal', object: terminal };
    }
  }
  
  return null;
}

export function pushCrate(character, crate, dx, dy, gameState) {
  if (character.type !== 'DD') return false; // Only DD can push crates
  
  const pushDistance = 5;
  const newX = crate.x + dx * pushDistance;
  const newY = crate.y + dy * pushDistance;
  
  const testBounds = {
    left: newX - crate.width / 2,
    right: newX + crate.width / 2,
    top: newY - crate.height / 2,
    bottom: newY + crate.height / 2
  };
  
  // Check world bounds
  if (testBounds.left < 0 || testBounds.right > gameState.worldWidth ||
      testBounds.top < 0 || testBounds.bottom > gameState.worldHeight) {
    return false;
  }
  
  // Check collision with walls
  for (const wall of gameState.walls) {
    const wallBounds = wall.getBounds();
    if (checkPointInBounds(testBounds.left, testBounds.top, wallBounds) ||
        checkPointInBounds(testBounds.right, testBounds.top, wallBounds) ||
        checkPointInBounds(testBounds.left, testBounds.bottom, wallBounds) ||
        checkPointInBounds(testBounds.right, testBounds.bottom, wallBounds)) {
      return false;
    }
  }
  
  // Check collision with other crates
  for (const other of gameState.crates) {
    if (other === crate) continue;
    const otherBounds = other.getBounds();
    if (checkPointInBounds(testBounds.left, testBounds.top, otherBounds) ||
        checkPointInBounds(testBounds.right, testBounds.top, otherBounds) ||
        checkPointInBounds(testBounds.left, testBounds.bottom, otherBounds) ||
        checkPointInBounds(testBounds.right, testBounds.bottom, otherBounds)) {
      return false;
    }
  }
  
  // Check doors
  for (const door of gameState.doors) {
    const doorBounds = door.getBounds();
    if (doorBounds && (
        checkPointInBounds(testBounds.left, testBounds.top, doorBounds) ||
        checkPointInBounds(testBounds.right, testBounds.top, doorBounds) ||
        checkPointInBounds(testBounds.left, testBounds.bottom, doorBounds) ||
        checkPointInBounds(testBounds.right, testBounds.bottom, doorBounds))) {
      return false;
    }
  }
  
  crate.move(dx * pushDistance, dy * pushDistance);
  return true;
}