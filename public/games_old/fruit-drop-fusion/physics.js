// physics.js - Physics collision and fusion handling

import { gameState, FRUIT_TIERS, GAME_PHASE } from './globals.js';
import { Fruit } from './fruit.js';

export class PhysicsEngine {
  constructor(p, particleSystem) {
    this.p = p;
    this.particleSystem = particleSystem;
  }

  update() {
    if (gameState.gamePhase !== GAME_PHASE.PLAYING) return;

    const fruits = gameState.fruits;
    
    // Update all fruits
    for (const fruit of fruits) {
      fruit.update();
    }

    // Check collisions between fruits
    for (let i = 0; i < fruits.length; i++) {
      for (let j = i + 1; j < fruits.length; j++) {
        if (fruits[i].isColliding(fruits[j])) {
          fruits[i].resolveCollision(fruits[j]);
          
          // Check for fusion
          this.checkFusion(fruits[i], fruits[j]);
        }
      }
    }

    // Check boundary collisions
    for (const fruit of fruits) {
      fruit.checkBoundaryCollision({
        x: 100,
        y: 150,
        width: 400,
        height: 250,
        wallThickness: 10
      });
    }

    // Remove marked fruits
    gameState.fruits = gameState.fruits.filter(f => !f.markedForRemoval);
  }

  checkFusion(fruit1, fruit2) {
    // Can only fuse same tier fruits
    if (fruit1.tier !== fruit2.tier) return;
    
    // Can't fuse to higher than watermelon
    if (fruit1.tier >= FRUIT_TIERS.length - 1) return;
    
    // Check if both fruits are settled
    if (!fruit1.settled || !fruit2.settled) return;
    
    // Prevent immediate fusion after creation
    const now = Date.now();
    if (now - fruit1.settleTime < 200 || now - fruit2.settleTime < 200) return;
    
    // Check relative velocity is low
    const relVelocity = Math.sqrt(
      Math.pow(fruit1.vx - fruit2.vx, 2) + 
      Math.pow(fruit1.vy - fruit2.vy, 2)
    );
    if (relVelocity > 2) return;

    // Perform fusion
    this.fuseFruits(fruit1, fruit2);
  }

  fuseFruits(fruit1, fruit2) {
    const newTier = fruit1.tier + 1;
    const fusionX = (fruit1.x + fruit2.x) / 2;
    const fusionY = (fruit1.y + fruit2.y) / 2;

    // Create particle effect
    this.particleSystem.createBurst(fusionX, fusionY, FRUIT_TIERS[newTier].color, 20);

    // Create new fruit
    const newFruit = new Fruit(this.p, fusionX, fusionY, newTier);
    newFruit.scale = 0.5; // Start small for animation
    gameState.fruits.push(newFruit);
    gameState.entities.push({ type: 'fruit', fruit: newFruit });

    // Animate scale
    const animationDuration = 300;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      newFruit.scale = 0.5 + (0.5 * progress);
      if (progress < 1) {
        setTimeout(animate, 16);
      }
    };
    animate();

    // Remove old fruits
    fruit1.markedForRemoval = true;
    fruit2.markedForRemoval = true;

    // Update score with combo
    const now = Date.now();
    if (now - gameState.lastFusionTime < 2000) {
      gameState.comboCount++;
    } else {
      gameState.comboCount = 1;
    }
    gameState.lastFusionTime = now;

    let basePoints = FRUIT_TIERS[newTier].points;
    let multiplier = 1.0;
    if (gameState.comboCount === 2) multiplier = 1.5;
    else if (gameState.comboCount === 3) multiplier = 2.0;
    else if (gameState.comboCount >= 4) multiplier = 2.5;

    const points = Math.floor(basePoints * multiplier);
    gameState.score += points;
    gameState.fusionCount++;

    // Track fusion for level goals
    gameState.entities.push({ type: 'fusion', tier: newTier, time: now });

    // Log player info
    this.p.logs.player_info.push({
      screen_x: fusionX,
      screen_y: fusionY,
      game_x: fusionX,
      game_y: fusionY,
      event: 'fusion',
      tier: newTier,
      points: points,
      framecount: this.p.frameCount
    });
  }

  checkLoseLine(loseLineY) {
    for (const fruit of gameState.fruits) {
      if (fruit.getTop() < loseLineY) {
        return true;
      }
    }
    return false;
  }
}