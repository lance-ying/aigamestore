// interactable.js - Interactive objects and puzzles

import { gameState, GAME_PHASES } from './globals.js';

export class Interactable {
  constructor(x, y, type, data = {}) {
    this.x = x;
    this.y = y;
    this.type = type; // "fragment", "door", "mechanism", "key"
    this.active = true;
    this.data = data;
    this.visualState = 0;
    this.requiresItem = data.requiresItem || false;
    this.requiredItem = data.requiredItem || null;
  }

  interact() {
    switch (this.type) {
      case "fragment":
        this.collectFragment();
        break;
      case "door":
        this.openDoor();
        break;
      case "mechanism":
        this.activateMechanism();
        break;
      case "key":
        this.collectKey();
        break;
    }
  }

  collectFragment() {
    if (!this.active) return;
    
    this.active = false;
    gameState.collectedFragments++;
    gameState.score += 100;
    
    // Add to inventory as memory
    gameState.inventory.push(`fragment_${gameState.collectedFragments}`);
    
    // Check if all fragments collected
    if (gameState.collectedFragments >= gameState.totalFragments) {
      gameState.doorUnlocked = true;
      // Unlock final door
      const finalDoor = gameState.interactables.find(i => i.type === "door" && i.data.isFinal);
      if (finalDoor) {
        finalDoor.data.locked = false;
      }
    }
  }

  openDoor() {
    if (this.data.locked) return;
    
    // Transition to next room
    if (this.data.nextRoom !== undefined) {
      gameState.currentRoom = this.data.nextRoom;
      // Reposition player
      if (gameState.player) {
        gameState.player.x = 100;
        gameState.player.y = 200;
      }
      
      // Check for final door (win condition)
      if (this.data.isFinal) {
        // Determine ending based on collected items and score
        if (gameState.collectedFragments >= gameState.totalFragments && gameState.secretsFound >= 2) {
          gameState.endingType = "TRANSCENDENCE";
        } else if (gameState.collectedFragments >= gameState.totalFragments) {
          gameState.endingType = "ESCAPE";
        } else {
          gameState.endingType = "LOST";
        }
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        gameState.score += 500;
      }
    }
  }

  activateMechanism() {
    if (!this.active) return;
    
    this.active = false;
    gameState.puzzlesSolved++;
    gameState.score += 50;
    
    // Unlock something based on mechanism
    if (this.data.unlocks) {
      const target = gameState.interactables.find(i => i.data.id === this.data.unlocks);
      if (target) {
        target.data.locked = false;
      }
    }
  }

  collectKey() {
    if (!this.active) return;
    
    this.active = false;
    gameState.inventory.push(this.data.keyId);
    gameState.secretsFound++;
    gameState.score += 75;
  }

  useItem() {
    if (this.requiresItem && this.data.locked) {
      this.data.locked = false;
      gameState.puzzlesSolved++;
      gameState.score += 100;
    }
  }

  update(p) {
    this.visualState += 0.05;
  }

  render(p) {
    if (!this.active) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    switch (this.type) {
      case "fragment":
        this.renderFragment(p);
        break;
      case "door":
        this.renderDoor(p);
        break;
      case "mechanism":
        this.renderMechanism(p);
        break;
      case "key":
        this.renderKey(p);
        break;
    }
    
    p.pop();
  }

  renderFragment(p) {
    // Floating, pulsing memory fragment
    const pulse = Math.sin(this.visualState) * 5;
    p.fill(255, 200, 100, 200);
    p.noStroke();
    p.circle(0, pulse, 20);
    
    // Glow effect
    p.fill(255, 220, 150, 100);
    p.circle(0, pulse, 30);
    
    // Sparkles
    for (let i = 0; i < 3; i++) {
      const angle = this.visualState + (i * Math.PI * 2 / 3);
      const sparkleX = Math.cos(angle) * 25;
      const sparkleY = Math.sin(angle) * 25 + pulse;
      p.fill(255, 255, 200, 150);
      p.circle(sparkleX, sparkleY, 5);
    }
  }

  renderDoor(p) {
    const locked = this.data.locked || false;
    const isFinal = this.data.isFinal || false;
    
    // Door frame
    p.fill(...(locked ? [80, 40, 40] : [40, 80, 60]));
    p.stroke(...(isFinal ? [255, 215, 0] : [100, 100, 120]));
    p.strokeWeight(3);
    p.rect(-30, -40, 60, 80);
    
    // Lock indicator
    if (locked) {
      p.fill(200, 50, 50);
      p.circle(0, 0, 15);
      p.fill(255, 100, 100);
      p.circle(0, -3, 5);
    } else {
      // Open indicator
      p.fill(100, 255, 100);
      p.circle(0, 0, 15);
    }
    
    // Final door special effect
    if (isFinal && !locked) {
      const glow = Math.sin(this.visualState) * 20 + 40;
      p.fill(255, 215, 0, glow);
      p.noStroke();
      p.rect(-35, -45, 70, 90);
    }
  }

  renderMechanism(p) {
    // Rotating mechanism
    p.rotate(this.visualState * 0.5);
    p.fill(150, 150, 180);
    p.stroke(200, 200, 220);
    p.strokeWeight(2);
    
    // Gear-like appearance
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2 / 6);
      p.push();
      p.rotate(angle);
      p.rect(-5, -25, 10, 50);
      p.pop();
    }
    
    // Center
    p.fill(100, 100, 120);
    p.circle(0, 0, 20);
  }

  renderKey(p) {
    // Key item
    p.fill(200, 180, 100);
    p.stroke(150, 130, 50);
    p.strokeWeight(2);
    
    // Key head
    p.circle(0, -10, 15);
    p.circle(0, -10, 8);
    
    // Key shaft
    p.rect(-3, -5, 6, 25);
    
    // Key teeth
    p.rect(0, 15, 8, 3);
    p.rect(0, 19, 5, 3);
  }
}

export function createInteractables() {
  return [
    // Room 0 - Starting room with first fragment
    new Interactable(500, 200, "fragment"),
    new Interactable(580, 200, "door", { nextRoom: 1, locked: false }),
    
    // Room 1 - Corridor with fragment and mechanism
    new Interactable(300, 150, "fragment"),
    new Interactable(200, 300, "mechanism", { unlocks: "door_room2" }),
    new Interactable(580, 200, "door", { nextRoom: 2, locked: true, id: "door_room2" }),
    
    // Room 2 - Maze with key and fragment
    new Interactable(250, 100, "key", { keyId: "maze_key" }),
    new Interactable(450, 300, "fragment"),
    new Interactable(580, 200, "door", { nextRoom: 3, locked: false }),
    
    // Room 3 - Chamber with fragment and locked door
    new Interactable(300, 100, "fragment"),
    new Interactable(580, 200, "door", { nextRoom: 4, locked: true, requiresItem: true, requiredItem: "maze_key", id: "door_room4" }),
    
    // Room 4 - Final room with last fragment and final door
    new Interactable(300, 200, "fragment"),
    new Interactable(580, 200, "door", { nextRoom: -1, locked: true, isFinal: true })
  ];
}