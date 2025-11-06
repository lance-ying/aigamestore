// interactable.js - Interactive objects in the game world

import { gameState } from './globals.js';

export class Interactable {
  constructor(x, y, type, id) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.id = id;
    this.interacted = false;
    this.visible = true;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  canInteract(player) {
    if (!this.visible || this.interacted) return false;
    const distance = player.distanceToPoint(this.x, this.y);
    if (distance > 100) return false;
    return player.isLookingAt(this.x, this.y, 0.6);
  }

  interact(p) {
    if (this.interacted) return null;
    this.interacted = true;
    
    switch (this.type) {
      case 'redKey':
        gameState.keysCollected.push('red');
        gameState.inventory.push('red_key');
        gameState.score += 100;
        gameState.messageQueue.push("Found the Crimson Key");
        return { success: true, message: "Crimson Key acquired", reward: 100 };
        
      case 'blueKey':
        gameState.keysCollected.push('blue');
        gameState.inventory.push('blue_key');
        gameState.score += 100;
        gameState.messageQueue.push("Found the Azure Key");
        return { success: true, message: "Azure Key acquired", reward: 100 };
        
      case 'machinery':
        if (gameState.keysCollected.includes('red')) {
          gameState.machineryActive = true;
          gameState.puzzlesSolved.push('machinery');
          gameState.score += 200;
          gameState.messageQueue.push("Machinery activated");
          return { success: true, message: "Machinery activated", reward: 200 };
        } else {
          this.interacted = false;
          gameState.messageQueue.push("Requires Crimson Key");
          return { success: false, message: "Locked - needs Crimson Key" };
        }
        
      case 'finalDoor':
        const hasRed = gameState.keysCollected.includes('red');
        const hasBlue = gameState.keysCollected.includes('blue');
        const machineryDone = gameState.machineryActive;
        
        if (hasRed && hasBlue && machineryDone) {
          gameState.finalDoorOpen = true;
          gameState.score += 500;
          return { success: true, message: "The door opens...", reward: 500, ending: true };
        } else {
          this.interacted = false;
          let missing = [];
          if (!hasRed) missing.push("Crimson Key");
          if (!hasBlue) missing.push("Azure Key");
          if (!machineryDone) missing.push("Machinery");
          gameState.messageQueue.push("Incomplete: " + missing.join(", "));
          return { success: false, message: "Incomplete" };
        }
        
      case 'secret':
        gameState.secretsFound.push(this.id);
        gameState.score += 50;
        gameState.messageQueue.push("Secret discovered");
        return { success: true, message: "Secret fragment found", reward: 50 };
        
      case 'narrative':
        gameState.narrativeFragments.push(this.id);
        gameState.score += 30;
        return { success: true, message: "Memory fragment", reward: 30 };
        
      default:
        return { success: false, message: "Nothing happens" };
    }
  }

  render(p, player) {
    if (!this.visible) return;
    
    // Calculate screen position relative to player
    const dx = this.x - player.worldX;
    const dy = this.y - player.worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Don't render if too far
    if (distance > 500) return;
    
    // Calculate angle relative to player view
    const angleToObject = Math.atan2(dy, dx);
    let relativeAngle = angleToObject - player.angle;
    
    // Normalize angle
    while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
    while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;
    
    // Check if in view frustum
    if (Math.abs(relativeAngle) > Math.PI / 3) return;
    
    // Calculate screen position
    const screenX = p.width / 2 + relativeAngle * 400;
    const size = p.map(distance, 0, 300, 60, 10);
    const screenY = p.height / 2 + p.map(distance, 0, 300, 0, 20);
    
    // Pulse effect
    this.pulsePhase += 0.05;
    const pulse = Math.sin(this.pulsePhase) * 5 + 5;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Draw based on type
    switch (this.type) {
      case 'redKey':
        p.fill(255, 50, 50, 200);
        p.stroke(255, 150, 150);
        p.strokeWeight(2);
        p.rect(-size/4, -size/2, size/2, size * 0.7);
        p.rect(-size/4, -size/2, size/4, size/4);
        break;
        
      case 'blueKey':
        p.fill(50, 150, 255, 200);
        p.stroke(150, 200, 255);
        p.strokeWeight(2);
        p.rect(-size/4, -size/2, size/2, size * 0.7);
        p.rect(-size/4, -size/2, size/4, size/4);
        break;
        
      case 'machinery':
        p.fill(180, 180, 100, 200);
        p.stroke(220, 220, 150);
        p.strokeWeight(2);
        p.rect(-size/2, -size/2, size, size);
        p.line(-size/3, 0, size/3, 0);
        p.line(0, -size/3, 0, size/3);
        break;
        
      case 'finalDoor':
        p.fill(200, 200, 200, 230);
        p.stroke(255, 255, 255);
        p.strokeWeight(3);
        p.rect(-size/3, -size/2, size * 0.66, size);
        p.fill(100, 100, 100);
        p.circle(size/6, 0, size/5);
        break;
        
      case 'secret':
      case 'narrative':
        p.fill(150, 100, 200, 180 + pulse);
        p.noStroke();
        p.circle(0, 0, size + pulse);
        p.fill(200, 150, 255, 150);
        p.circle(0, 0, size/2 + pulse/2);
        break;
    }
    
    // Draw interaction hint if player can interact
    if (this.canInteract(player)) {
      p.fill(255, 255, 255, 200);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text("[SPACE]", 0, size);
    }
    
    p.pop();
  }
}