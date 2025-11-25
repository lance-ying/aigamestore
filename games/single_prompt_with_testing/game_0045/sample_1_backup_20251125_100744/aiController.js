import { gameState } from './globals.js';

// AI controller for automated testing
export class AIController {
  constructor() {
    this.testMode = "TEST_1";
    this.testTimer = 0;
    this.testPhase = 0;
    this.movementTimer = 0;
  }
  
  update(deltaTime) {
    if (gameState.controlMode === "HUMAN") return;
    
    this.testTimer += deltaTime;
    
    switch (gameState.controlMode) {
      case "TEST_1":
        this.runTest1();
        break;
      case "TEST_2":
        this.runTest2();
        break;
    }
  }
  
  runTest1() {
    // TEST_1: Basic movement and camera test
    if (!gameState.player) return;
    
    this.movementTimer += 0.016;
    
    // Move in a circular pattern
    const angle = this.movementTimer * 0.5;
    
    if (Math.cos(angle) > 0) {
      gameState.player.moveForward();
    } else {
      gameState.player.moveBackward();
    }
    
    if (Math.sin(angle) > 0) {
      gameState.player.strafeRight();
    } else {
      gameState.player.strafeLeft();
    }
    
    // Jump occasionally
    if (Math.floor(this.movementTimer * 2) % 3 === 0 && gameState.player.onGround) {
      gameState.player.jump();
    }
  }
  
  runTest2() {
    // TEST_2: Win condition test - collect cards and eliminate demons efficiently
    if (!gameState.player) return;
    
    // Find nearest card if we need more
    if (gameState.player.cards < 2 && gameState.cards.length > 0) {
      this.moveToTarget(gameState.cards[0].mesh.position);
      return;
    }
    
    // Find and shoot nearest demon
    if (gameState.demons.length > 0 && gameState.player.cards > 0) {
      const nearestDemon = this.findNearestDemon();
      if (nearestDemon) {
        this.moveToTarget(nearestDemon.mesh.position);
        
        // Shoot when close enough and facing demon
        const distance = gameState.player.mesh.position.distanceTo(nearestDemon.mesh.position);
        if (distance < 15) {
          // Simple shooting - just spam Z since we're always moving toward target
          if (Math.random() < 0.1) { // 10% chance per frame to shoot
            gameState.player.shoot();
          }
        }
      }
    } else if (gameState.cards.length > 0) {
      // Need more cards
      this.moveToTarget(gameState.cards[0].mesh.position);
    }
  }
  
  moveToTarget(targetPosition) {
    if (!gameState.player) return;
    
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, gameState.player.mesh.position);
    
    const distance = direction.length();
    direction.normalize();
    
    // Move toward target
    if (direction.z < -0.3) {
      gameState.player.moveForward();
    } else if (direction.z > 0.3) {
      gameState.player.moveBackward();
    }
    
    if (direction.x < -0.3) {
      gameState.player.strafeLeft();
    } else if (direction.x > 0.3) {
      gameState.player.strafeRight();
    }
    
    // Jump if target is higher
    if (targetPosition.y > gameState.player.mesh.position.y + 1 && gameState.player.onGround) {
      gameState.player.jump();
    }
    
    // Use dash occasionally for speed
    if (distance > 5 && gameState.player.cards > 3 && gameState.player.canDash && Math.random() < 0.05) {
      gameState.player.dash();
    }
  }
  
  findNearestDemon() {
    if (!gameState.player || gameState.demons.length === 0) return null;
    
    let nearest = null;
    let minDistance = Infinity;
    
    for (const demon of gameState.demons) {
      const distance = gameState.player.mesh.position.distanceTo(demon.mesh.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = demon;
      }
    }
    
    return nearest;
  }
}