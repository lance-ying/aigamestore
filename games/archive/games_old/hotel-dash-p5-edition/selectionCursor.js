import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class SelectionCursor {
  constructor(p) {
    this.p = p;
    this.pulsePhase = 0;
    this.pulseSpeed = 0.1;
  }

  update(deltaTime) {
    this.pulsePhase += this.pulseSpeed;
    if (this.pulsePhase > Math.PI * 2) {
      this.pulsePhase = 0;
    }
  }

  draw() {
    if (gameState.selectables.length === 0) return;
    
    const selected = gameState.selectables[gameState.cursorIndex];
    if (!selected) return;
    
    const p = this.p;
    p.push();
    
    // Pulsating highlight
    const pulseSize = 8 + Math.sin(this.pulsePhase) * 4;
    const alpha = 150 + Math.sin(this.pulsePhase) * 50;
    
    p.noFill();
    p.stroke(255, 220, 0, alpha);
    p.strokeWeight(3);
    
    if (selected.width !== undefined) {
      // Rectangle (Room, Kitchen, Reception)
      p.rect(selected.x - pulseSize/2, selected.y - pulseSize/2, 
             selected.width + pulseSize, selected.height + pulseSize);
    } else if (selected.size !== undefined) {
      // Circle (Guest, Staff)
      p.ellipse(selected.x, selected.y, selected.size + pulseSize, selected.size + pulseSize);
    }
    
    // Selection state indicator
    if (gameState.selectedEntity) {
      p.fill(255, 220, 0, 200);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      
      let instruction = "Select target";
      if (gameState.selectedEntity.need) {
        if (gameState.selectedEntity.need === "CHECKIN") {
          instruction = "Select empty room";
        } else if (gameState.selectedEntity.need === "FOOD") {
          instruction = "Select kitchen";
        }
      } else if (gameState.selectedEntity.name === "Monica") {
        instruction = "Select dirty room";
      }
      
      p.text(instruction, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
    }
    
    p.pop();
  }

  moveUp() {
    const current = gameState.selectables[gameState.cursorIndex];
    let nearestIndex = -1;
    let minDist = Infinity;
    
    for (let i = 0; i < gameState.selectables.length; i++) {
      if (i === gameState.cursorIndex) continue;
      const sel = gameState.selectables[i];
      const centerY = sel.y + (sel.height || 0) / 2;
      const currentY = current.y + (current.height || 0) / 2;
      
      if (centerY < currentY) {
        const dist = this.p.dist(
          current.x + (current.width || 0) / 2, currentY,
          sel.x + (sel.width || 0) / 2, centerY
        );
        if (dist < minDist) {
          minDist = dist;
          nearestIndex = i;
        }
      }
    }
    
    if (nearestIndex !== -1) {
      gameState.cursorIndex = nearestIndex;
    }
  }

  moveDown() {
    const current = gameState.selectables[gameState.cursorIndex];
    let nearestIndex = -1;
    let minDist = Infinity;
    
    for (let i = 0; i < gameState.selectables.length; i++) {
      if (i === gameState.cursorIndex) continue;
      const sel = gameState.selectables[i];
      const centerY = sel.y + (sel.height || 0) / 2;
      const currentY = current.y + (current.height || 0) / 2;
      
      if (centerY > currentY) {
        const dist = this.p.dist(
          current.x + (current.width || 0) / 2, currentY,
          sel.x + (sel.width || 0) / 2, centerY
        );
        if (dist < minDist) {
          minDist = dist;
          nearestIndex = i;
        }
      }
    }
    
    if (nearestIndex !== -1) {
      gameState.cursorIndex = nearestIndex;
    }
  }

  moveLeft() {
    const current = gameState.selectables[gameState.cursorIndex];
    let nearestIndex = -1;
    let minDist = Infinity;
    
    for (let i = 0; i < gameState.selectables.length; i++) {
      if (i === gameState.cursorIndex) continue;
      const sel = gameState.selectables[i];
      const centerX = sel.x + (sel.width || 0) / 2;
      const currentX = current.x + (current.width || 0) / 2;
      
      if (centerX < currentX) {
        const dist = this.p.dist(
          currentX, current.y + (current.height || 0) / 2,
          centerX, sel.y + (sel.height || 0) / 2
        );
        if (dist < minDist) {
          minDist = dist;
          nearestIndex = i;
        }
      }
    }
    
    if (nearestIndex !== -1) {
      gameState.cursorIndex = nearestIndex;
    }
  }

  moveRight() {
    const current = gameState.selectables[gameState.cursorIndex];
    let nearestIndex = -1;
    let minDist = Infinity;
    
    for (let i = 0; i < gameState.selectables.length; i++) {
      if (i === gameState.cursorIndex) continue;
      const sel = gameState.selectables[i];
      const centerX = sel.x + (sel.width || 0) / 2;
      const currentX = current.x + (current.width || 0) / 2;
      
      if (centerX > currentX) {
        const dist = this.p.dist(
          currentX, current.y + (current.height || 0) / 2,
          centerX, sel.y + (sel.height || 0) / 2
        );
        if (dist < minDist) {
          minDist = dist;
          nearestIndex = i;
        }
      }
    }
    
    if (nearestIndex !== -1) {
      gameState.cursorIndex = nearestIndex;
    }
  }
}