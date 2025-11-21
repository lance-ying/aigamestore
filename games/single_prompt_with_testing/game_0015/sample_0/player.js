// player.js - Player entity and controls

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.angle = 0; // Facing direction (radians)
    this.speed = 2;
    this.sprintMultiplier = 1.8;
    this.turnSpeed = 0.05;
    this.radius = 15;
    this.height = 60;
    this.bobOffset = 0;
    this.bobSpeed = 0.15;
    this.interactionRange = 50;
  }

  update(p, actions) {
    let moving = false;
    let currentSpeed = this.speed;
    
    if (actions.sprint) {
      currentSpeed *= this.sprintMultiplier;
    }

    // Forward/backward movement
    if (actions.forward) {
      const newX = this.x + p.cos(this.angle) * currentSpeed;
      const newZ = this.z + p.sin(this.angle) * currentSpeed;
      if (this.canMoveTo(newX, newZ)) {
        this.x = newX;
        this.z = newZ;
        moving = true;
      }
    }
    if (actions.backward) {
      const newX = this.x - p.cos(this.angle) * currentSpeed * 0.6;
      const newZ = this.z - p.sin(this.angle) * currentSpeed * 0.6;
      if (this.canMoveTo(newX, newZ)) {
        this.x = newX;
        this.z = newZ;
        moving = true;
      }
    }

    // Turning
    if (actions.left) {
      this.angle -= this.turnSpeed;
    }
    if (actions.right) {
      this.angle += this.turnSpeed;
    }

    // Head bob animation
    if (moving) {
      this.bobOffset += this.bobSpeed;
    } else {
      this.bobOffset *= 0.8;
    }

    // Check for nearby interactable objects
    this.checkNearbyObjects();

    // Interaction
    if (actions.interact && gameState.nearbyObject) {
      this.interactWithObject(gameState.nearbyObject);
    }

    // Update room based on position
    this.updateCurrentRoom();
  }

  canMoveTo(newX, newZ) {
    // Check collision with walls
    for (let wall of gameState.walls) {
      if (this.checkWallCollision(newX, newZ, wall)) {
        return false;
      }
    }
    return true;
  }

  checkWallCollision(x, z, wall) {
    // Simple AABB collision for walls
    const buffer = this.radius;
    return (
      x + buffer > wall.x1 && x - buffer < wall.x2 &&
      z + buffer > wall.z1 && z - buffer < wall.z2
    );
  }

  checkNearbyObjects() {
    gameState.nearbyObject = null;
    let closestDist = this.interactionRange;

    for (let obj of gameState.interactables) {
      if (obj.collected) continue;
      
      const dist = Math.sqrt(
        Math.pow(this.x - obj.x, 2) + 
        Math.pow(this.z - obj.z, 2)
      );

      if (dist < closestDist) {
        closestDist = dist;
        gameState.nearbyObject = obj;
      }
    }
  }

  interactWithObject(obj) {
    if (!obj || obj.collected) return;

    obj.collected = true;
    
    if (obj.type === 'clue') {
      gameState.cluesCollected++;
      gameState.score += 100;
      gameState.messageQueue.push({
        text: `Clue found: ${obj.name}`,
        duration: 180,
        color: [200, 255, 200]
      });
    } else if (obj.type === 'puzzle') {
      if (!gameState.puzzlesSolved.includes(obj.id)) {
        gameState.puzzlesSolved.push(obj.id);
        gameState.score += 200;
        gameState.messageQueue.push({
          text: `Puzzle solved: ${obj.name}`,
          duration: 180,
          color: [255, 255, 150]
        });
      }
    } else if (obj.type === 'exit') {
      // Check if player has enough clues for true ending
      if (gameState.cluesCollected >= gameState.totalClues) {
        gameState.gamePhase = "GAME_OVER_WIN";
      } else {
        gameState.messageQueue.push({
          text: "You need more clues to escape...",
          duration: 180,
          color: [255, 100, 100]
        });
      }
    }
  }

  updateCurrentRoom() {
    // Determine current room based on position
    if (this.z < -100) {
      gameState.currentRoom = "north_hall";
    } else if (this.z > 100) {
      gameState.currentRoom = "south_hall";
    } else if (this.x < -100) {
      gameState.currentRoom = "west_room";
    } else if (this.x > 100) {
      gameState.currentRoom = "east_room";
    } else {
      gameState.currentRoom = "entrance";
    }
  }

  getScreenPosition() {
    return {
      screen_x: CANVAS_WIDTH / 2,
      screen_y: CANVAS_HEIGHT / 2,
      game_x: this.x,
      game_y: this.z
    };
  }
}