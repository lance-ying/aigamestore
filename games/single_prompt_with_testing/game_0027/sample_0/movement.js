// movement.js - Movement and collision handling

import { gameState, GRID_ROWS, GRID_COLS } from './globals.js';
import { hasProperty } from './rules.js';

export function canMove(obj, dx, dy) {
  const newX = obj.gridX + dx;
  const newY = obj.gridY + dy;

  if (newX < 0 || newX >= GRID_COLS || newY < 0 || newY >= GRID_ROWS) {
    return false;
  }

  return true;
}

export function getObjectsAt(x, y) {
  const objects = [];
  
  // Check entities
  for (const entity of gameState.entities) {
    if (!entity.deleted && entity.gridX === x && entity.gridY === y) {
      objects.push({ obj: entity, type: 'entity' });
    }
  }

  // Check word blocks
  for (const word of gameState.wordBlocks) {
    if (!word.deleted && word.gridX === x && word.gridY === y) {
      objects.push({ obj: word, type: 'word' });
    }
  }

  return objects;
}

export function tryMove(obj, dx, dy, isPlayer = false) {
  const newX = obj.gridX + dx;
  const newY = obj.gridY + dy;

  if (!canMove(obj, dx, dy)) {
    return false;
  }

  const objectsAtTarget = getObjectsAt(newX, newY);

  // Check for STOP objects
  for (const target of objectsAtTarget) {
    if (target.type === 'entity') {
      if (hasProperty(target.obj.type, "STOP")) {
        return false;
      }
    }
  }

  // Try to push objects
  const pushableObjects = [];
  for (const target of objectsAtTarget) {
    let canPush = false;
    
    if (target.type === 'entity') {
      canPush = hasProperty(target.obj.type, "PUSH");
    } else if (target.type === 'word') {
      canPush = true; // Word blocks are always pushable
    }

    if (canPush) {
      pushableObjects.push(target.obj);
    } else if (!hasProperty(target.obj.type, "SINK")) {
      // Can't move through non-pushable, non-sink objects
      return false;
    }
  }

  // Try to push all pushable objects
  for (const pushObj of pushableObjects) {
    if (!tryMove(pushObj, dx, dy, false)) {
      return false;
    }
  }

  // Move the object
  obj.startMove(newX, newY);

  // Check for SINK interactions
  if (isPlayer) {
    checkSinkInteractions(obj, newX, newY);
  }

  return true;
}

export function checkSinkInteractions(mover, x, y) {
  const objectsHere = getObjectsAt(x, y);
  
  for (const target of objectsHere) {
    if (target.type === 'entity' && target.obj !== mover) {
      if (hasProperty(target.obj.type, "SINK")) {
        // Both objects sink
        target.obj.deleted = true;
        mover.deleted = true;
      }
    }
  }
}

export function movePlayer(dx, dy) {
  const playerTypes = gameState.playerControlledTypes;
  
  if (playerTypes.length === 0) {
    return false;
  }

  let anyMoved = false;

  // Move all player-controlled entities
  for (const entity of gameState.entities) {
    if (!entity.deleted && playerTypes.includes(entity.type)) {
      if (tryMove(entity, dx, dy, true)) {
        anyMoved = true;
      }
    }
  }

  // Update player reference
  if (gameState.entities.length > 0) {
    for (const entity of gameState.entities) {
      if (!entity.deleted && playerTypes.includes(entity.type)) {
        gameState.player = entity;
        break;
      }
    }
  }

  return anyMoved;
}