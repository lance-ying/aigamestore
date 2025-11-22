import { gameState, FRUIT_TYPES, CONTAINER_X, CONTAINER_WIDTH, CONTAINER_Y, MERGE_DELAY, DANGER_LINE_Y } from './globals.js';
import { Fruit } from './fruit.js';

export function initializeGame(p) {
  gameState.entities = [];
  gameState.score = 0;
  gameState.previewX = (CONTAINER_X + CONTAINER_WIDTH / 2);
  gameState.canDrop = true;
  gameState.dropCooldown = 0;
  gameState.framesSinceLastDrop = 0;
  gameState.mergeQueue = [];
  gameState.watermelonCreated = false;
  gameState.fruitsSettled = true;
  
  // Start with a random fruit from the first 5 types
  gameState.nextFruitType = Math.floor(p.random(0, 5));
  createPreviewFruit(p);
}

export function createPreviewFruit(p) {
  gameState.previewFruit = {
    type: gameState.nextFruitType,
    radius: FRUIT_TYPES[gameState.nextFruitType].radius,
    color: FRUIT_TYPES[gameState.nextFruitType].color,
    name: FRUIT_TYPES[gameState.nextFruitType].name
  };
  
  // Generate next fruit type (weighted towards smaller fruits)
  const rand = p.random();
  if (rand < 0.4) {
    gameState.nextFruitType = 0; // Cherry
  } else if (rand < 0.65) {
    gameState.nextFruitType = 1; // Strawberry
  } else if (rand < 0.8) {
    gameState.nextFruitType = 2; // Grape
  } else if (rand < 0.9) {
    gameState.nextFruitType = 3; // Orange
  } else {
    gameState.nextFruitType = 4; // Apple
  }
}

export function dropFruit(p) {
  if (!gameState.canDrop || !gameState.previewFruit) return;
  
  const newFruit = new Fruit(
    gameState.previewX,
    CONTAINER_Y + 20,
    gameState.previewFruit.type,
    p
  );
  
  gameState.entities.push(newFruit);
  gameState.canDrop = false;
  gameState.dropCooldown = 30; // 0.5 seconds at 60 FPS
  gameState.framesSinceLastDrop = 0;
  gameState.fruitsSettled = false;
  
  createPreviewFruit(p);
}

export function updateGame(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Update drop cooldown
  if (gameState.dropCooldown > 0) {
    gameState.dropCooldown--;
    if (gameState.dropCooldown === 0) {
      gameState.canDrop = true;
    }
  }
  
  gameState.framesSinceLastDrop++;
  
  // Update all fruits
  for (const fruit of gameState.entities) {
    fruit.update();
  }
  
  // Check collisions between all fruits
  for (let i = 0; i < gameState.entities.length; i++) {
    for (let j = i + 1; j < gameState.entities.length; j++) {
      gameState.entities[i].checkCollision(gameState.entities[j]);
    }
  }
  
  // Check for merges after fruits have settled a bit
  if (gameState.framesSinceLastDrop > MERGE_DELAY) {
    checkMerges(p);
    processMerges(p);
  }
  
  // Check if all fruits are settled
  gameState.fruitsSettled = gameState.entities.every(f => f.settled);
  
  // Check game over condition
  checkGameOver(p);
}

export function checkMerges(p) {
  for (let i = 0; i < gameState.entities.length; i++) {
    const fruit1 = gameState.entities[i];
    if (fruit1.markedForMerge) continue;
    
    for (let j = i + 1; j < gameState.entities.length; j++) {
      const fruit2 = gameState.entities[j];
      if (fruit2.markedForMerge) continue;
      
      // Check if same type and touching
      if (fruit1.type === fruit2.type && fruit1.type < FRUIT_TYPES.length - 1) {
        const dx = fruit1.x - fruit2.x;
        const dy = fruit1.y - fruit2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = fruit1.radius + fruit2.radius;
        
        if (distance < minDist * 1.1) {
          // Mark for merge
          fruit1.markedForMerge = true;
          fruit2.markedForMerge = true;
          fruit1.mergePartner = fruit2;
          fruit2.mergePartner = fruit1;
          
          gameState.mergeQueue.push({ fruit1, fruit2 });
          break;
        }
      }
    }
  }
}

export function processMerges(p) {
  if (gameState.mergeQueue.length === 0) return;
  
  const processedMerges = [];
  
  for (const merge of gameState.mergeQueue) {
    const { fruit1, fruit2 } = merge;
    
    // Check if fruits still exist
    if (!gameState.entities.includes(fruit1) || !gameState.entities.includes(fruit2)) {
      continue;
    }
    
    // Remove merged fruits
    gameState.entities = gameState.entities.filter(f => f !== fruit1 && f !== fruit2);
    
    // Create new fruit
    const newType = fruit1.type + 1;
    const midX = (fruit1.x + fruit2.x) / 2;
    const midY = (fruit1.y + fruit2.y) / 2;
    
    const newFruit = new Fruit(midX, midY, newType, p);
    gameState.entities.push(newFruit);
    
    // Add score
    const scoreGain = FRUIT_TYPES[newType].points;
    gameState.score += scoreGain;
    
    // Check if watermelon was created
    if (newType === 9) {
      gameState.watermelonCreated = true;
    }
    
    processedMerges.push(merge);
  }
  
  gameState.mergeQueue = [];
  gameState.framesSinceLastDrop = 0;
}

export function checkGameOver(p) {
  // Check if any fruit is above danger line and settled
  for (const fruit of gameState.entities) {
    if (fruit.isOverDangerLine() && fruit.settled && gameState.framesSinceLastDrop > 60) {
      if (gameState.watermelonCreated) {
        gameState.gamePhase = "GAME_OVER_WIN";
      } else {
        gameState.gamePhase = "GAME_OVER_LOSE";
      }
      
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
      }
      
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      return;
    }
  }
}

export function handleMovement(p) {
  if (gameState.gamePhase !== "PLAYING" || !gameState.canDrop) return;
  
  const moveSpeed = 4;
  const minX = CONTAINER_X + (gameState.previewFruit?.radius || 20);
  const maxX = CONTAINER_X + CONTAINER_WIDTH - (gameState.previewFruit?.radius || 20);
  
  if (gameState.controlMode === "HUMAN") {
    if (p.keyIsDown(37)) { // Left arrow
      gameState.previewX = Math.max(minX, gameState.previewX - moveSpeed);
    }
    if (p.keyIsDown(39)) { // Right arrow
      gameState.previewX = Math.min(maxX, gameState.previewX + moveSpeed);
    }
  }
}