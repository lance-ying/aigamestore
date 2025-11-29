// renderer.js - Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN } from './globals.js';

export class Renderer {
  constructor(p) {
    this.p = p;
  }
  
  drawStartScreen() {
    const p = this.p;
    p.background(20, 15, 10);
    
    // Title with decorative elements
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    
    // Decorative frame
    p.stroke(150, 120, 80);
    p.strokeWeight(3);
    p.noFill();
    p.rect(50, 40, 500, 320);
    
    p.stroke(100, 80, 50);
    p.strokeWeight(1);
    p.rect(60, 50, 480, 300);
    
    // Title
    p.fill(200, 180, 140);
    p.textSize(36);
    p.text("THE HOUSE OF DA VINCI", 300, 100);
    
    // Subtitle
    p.textSize(14);
    p.fill(150, 130, 100);
    p.text("A Renaissance Mystery", 300, 135);
    
    // Description
    p.textSize(12);
    p.fill(180, 160, 130);
    p.textAlign(p.CENTER, p.CENTER);
    const desc = "Explore the master's workshop and solve intricate mechanical\npuzzles to uncover the truth of his disappearance.";
    p.text(desc, 300, 180);
    
    // Instructions
    p.textSize(11);
    p.fill(160, 140, 110);
    p.textAlign(p.LEFT, p.TOP);
    const instructions = [
      "ARROW KEYS - Look around the workshop",
      "Z - Interact with puzzle elements",
      "SPACE - Toggle Oculus Perpetua (reveals hidden mechanisms)",
      "ESC - Pause game",
      "R - Restart game"
    ];
    
    let yPos = 230;
    for (let inst of instructions) {
      p.text(inst, 100, yPos);
      yPos += 20;
    }
    
    // Start prompt with animation
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
    p.fill(200, 180, 140, alpha);
    p.text("PRESS ENTER TO START", 300, 350);
    
    p.pop();
  }
  
  drawPauseIndicator() {
    const p = this.p;
    p.push();
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.fill(255, 220, 100);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }
  
  drawGameOverScreen() {
    const p = this.p;
    p.background(20, 15, 10);
    
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    
    // Decorative frame
    p.stroke(150, 120, 80);
    p.strokeWeight(3);
    p.noFill();
    p.rect(50, 50, 500, 300);
    
    // Victory message
    p.fill(220, 200, 150);
    p.textSize(32);
    p.text("MYSTERY SOLVED", 300, 120);
    
    p.textSize(14);
    p.fill(180, 160, 120);
    p.text("You have uncovered the truth of the master's disappearance", 300, 170);
    p.text("and restored the mechanisms of his greatest inventions.", 300, 190);
    
    // Score
    p.textSize(20);
    p.fill(200, 180, 140);
    p.text(`Final Score: ${gameState.score}`, 300, 240);
    p.text(`Rooms Completed: ${gameState.roomsCompleted + 1}/${gameState.totalRooms}`, 300, 270);
    
    // Restart prompt
    p.textSize(16);
    const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
    p.fill(200, 180, 140, alpha);
    p.text("PRESS R TO RESTART", 300, 320);
    
    p.pop();
  }
  
  drawPlayingScreen(roomManager) {
    const p = this.p;
    const room = roomManager.getCurrentRoom();
    
    // Background
    p.background(...room.backgroundColor);
    
    // Draw environment with perspective
    this.drawEnvironment(room);
    
    // Draw puzzle elements
    this.drawPuzzleElements();
    
    // Draw UI
    this.drawUI(room);
    
    // Draw crosshair
    this.drawCrosshair();
  }
  
  drawEnvironment(room) {
    const p = this.p;
    const player = gameState.player;
    
    // Floor with perspective grid
    p.push();
    p.stroke(60, 55, 50);
    p.strokeWeight(1);
    
    const gridSize = 50;
    const viewAngle = player.viewAngle;
    
    // Simplified floor rendering
    for (let i = -3; i <= 3; i++) {
      const y = 300 + i * 30 + player.viewPitch * 1.5;
      const width = 400 - Math.abs(i) * 40;
      p.line(300 - width, y, 300 + width, y);
    }
    p.pop();
    
    // Walls based on view angle
    p.push();
    p.noStroke();
    
    // Left wall
    p.fill(50, 45, 40);
    const leftVis = Math.max(0, Math.cos((viewAngle - 270) * Math.PI / 180));
    if (leftVis > 0) {
      p.rect(0, 0, 100 * leftVis, CANVAS_HEIGHT);
    }
    
    // Right wall
    const rightVis = Math.max(0, Math.cos((viewAngle - 90) * Math.PI / 180));
    if (rightVis > 0) {
      p.rect(CANVAS_WIDTH - 100 * rightVis, 0, 100 * rightVis, CANVAS_HEIGHT);
    }
    
    // Back wall
    const backVis = Math.max(0, Math.cos((viewAngle - 180) * Math.PI / 180));
    if (backVis > 0) {
      p.fill(45, 40, 35);
      p.rect(100, 50, CANVAS_WIDTH - 200, 100 * backVis);
    }
    
    p.pop();
    
    // Ambient lighting effect
    if (gameState.oculusActive) {
      p.push();
      p.fill(100, 150, 255, 20);
      p.noStroke();
      p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      p.pop();
    }
  }
  
  drawPuzzleElements() {
    const p = this.p;
    const player = gameState.player;
    
    // Sort elements by distance (far to near)
    const sortedElements = [...gameState.puzzleElements].sort((a, b) => {
      const distA = Math.sqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
      const distB = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
      return distB - distA;
    });
    
    gameState.targetElement = null;
    let closestDist = Infinity;
    
    for (let element of sortedElements) {
      // Check visibility with Oculus
      if (element.requiresOculus && !gameState.oculusActive) {
        continue;
      }
      
      const screenPos = element.getScreenPosition(player);
      if (!screenPos) continue;
      
      const { x, y, scale, distance } = screenPos;
      
      // Check if this is the closest element near crosshair
      const crosshairDist = Math.sqrt((x - 300) ** 2 + (y - 200) ** 2);
      if (crosshairDist < 50 && distance < gameState.interactionRange && distance < closestDist) {
        closestDist = distance;
        gameState.targetElement = element;
      }
      
      p.push();
      p.translate(x, y);
      p.scale(scale);
      
      // Draw based on type
      const isAccessible = element.isAccessible();
      const isTarget = element === gameState.targetElement;
      
      switch (element.type) {
        case 'lever':
          this.drawLever(element, isAccessible, isTarget);
          break;
        case 'gear':
          this.drawGear(element, isAccessible, isTarget);
          break;
        case 'compartment':
          this.drawCompartment(element, isAccessible, isTarget);
          break;
        case 'valve':
          this.drawValve(element, isAccessible, isTarget);
          break;
      }
      
      p.pop();
    }
  }
  
  drawLever(element, isAccessible, isTarget) {
    const p = this.p;
    
    // Base
    p.fill(80, 70, 60);
    p.stroke(60, 50, 40);
    p.strokeWeight(2);
    p.rect(-15, 20, 30, 20);
    
    // Lever arm
    p.push();
    p.rotate(element.angle * Math.PI / 180);
    p.fill(...(element.solved ? [100, 200, 100] : (isAccessible ? [120, 100, 80] : [80, 70, 70])));
    if (isTarget) {
      p.stroke(255, 220, 100);
      p.strokeWeight(3);
    } else {
      p.stroke(60, 50, 40);
      p.strokeWeight(2);
    }
    p.rect(-5, -40, 10, 40);
    
    // Handle
    p.fill(100, 90, 70);
    p.circle(0, -40, 12);
    p.pop();
  }
  
  drawGear(element, isAccessible, isTarget) {
    const p = this.p;
    
    const r = element.radius;
    const teeth = element.teeth;
    
    p.push();
    p.rotate(element.angle * Math.PI / 180);
    
    // Gear body
    p.fill(...(element.solved ? [100, 200, 100] : (isAccessible ? [120, 100, 80] : [80, 70, 70])));
    if (isTarget) {
      p.stroke(255, 220, 100);
      p.strokeWeight(3);
    } else {
      p.stroke(60, 50, 40);
      p.strokeWeight(2);
    }
    
    p.beginShape();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i / (teeth * 2)) * p.TWO_PI;
      const rad = i % 2 === 0 ? r : r * 0.8;
      const x = Math.cos(angle) * rad;
      const y = Math.sin(angle) * rad;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    
    // Center hole
    p.fill(40, 35, 30);
    p.circle(0, 0, r * 0.4);
    
    p.pop();
  }
  
  drawCompartment(element, isAccessible, isTarget) {
    const p = this.p;
    
    if (element.solved) {
      // Open compartment
      p.fill(60, 55, 50);
      p.stroke(40, 35, 30);
      p.strokeWeight(2);
      p.rect(-30, -20, 60, 40);
      
      // Contents
      p.fill(200, 180, 100);
      p.noStroke();
      p.rect(-20, -10, 40, 20);
    } else {
      // Closed compartment (only visible with Oculus)
      p.fill(80, 80, 100, 150);
      if (isTarget) {
        p.stroke(255, 220, 100);
        p.strokeWeight(3);
      } else {
        p.stroke(100, 100, 120, 150);
        p.strokeWeight(2);
      }
      p.rect(-30, -20, 60, 40);
      
      // Hidden indicator
      p.fill(150, 150, 200, 100);
      p.noStroke();
      p.circle(0, 0, 10);
    }
  }
  
  drawValve(element, isAccessible, isTarget) {
    const p = this.p;
    
    const r = element.radius;
    
    p.push();
    p.rotate(element.angle * Math.PI / 180);
    
    // Valve wheel
    p.fill(...(element.solved ? [100, 200, 100] : (isAccessible ? [120, 100, 80] : [80, 70, 70])));
    if (isTarget) {
      p.stroke(255, 220, 100);
      p.strokeWeight(3);
    } else {
      p.stroke(60, 50, 40);
      p.strokeWeight(2);
    }
    p.circle(0, 0, r * 2);
    
    // Spokes
    p.strokeWeight(4);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * p.TWO_PI;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      p.line(0, 0, x, y);
    }
    
    // Center
    p.fill(60, 50, 40);
    p.noStroke();
    p.circle(0, 0, r * 0.5);
    
    p.pop();
  }
  
  drawCrosshair() {
    const p = this.p;
    p.push();
    p.stroke(200, 180, 140, 150);
    p.strokeWeight(2);
    p.line(290, 200, 310, 200);
    p.line(300, 190, 300, 210);
    
    // Highlight if targeting
    if (gameState.targetElement) {
      p.stroke(255, 220, 100);
      p.strokeWeight(1);
      p.noFill();
      p.circle(300, 200, 30);
    }
    p.pop();
  }
  
  drawUI(room) {
    const p = this.p;
    
    // Semi-transparent UI background
    p.push();
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 40);
    p.rect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
    p.pop();
    
    // Top UI
    p.push();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.fill(220, 200, 150);
    p.text(`Room: ${room.name}`, 10, 12);
    
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 12);
    p.pop();
    
    // Bottom UI
    p.push();
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(12);
    p.fill(220, 200, 150);
    p.text(`Puzzles: ${gameState.puzzlesSolved}/${gameState.puzzlesInRoom}`, 10, CANVAS_HEIGHT - 12);
    
    // Oculus energy bar
    const barWidth = 150;
    const barHeight = 15;
    const barX = CANVAS_WIDTH - barWidth - 10;
    const barY = CANVAS_HEIGHT - 30;
    
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.fill(220, 200, 150);
    p.text("Oculus:", barX - 5, CANVAS_HEIGHT - 12);
    
    // Bar background
    p.fill(40, 40, 50);
    p.stroke(100, 100, 120);
    p.strokeWeight(1);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Bar fill
    const fillWidth = (gameState.oculusEnergy / 100) * barWidth;
    if (gameState.oculusActive) {
      p.fill(100, 150, 255);
    } else {
      p.fill(150, 150, 200);
    }
    p.noStroke();
    p.rect(barX, barY, fillWidth, barHeight);
    
    p.pop();
    
    // Interaction hint
    if (gameState.targetElement) {
      p.push();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.fill(255, 220, 100);
      const hint = gameState.targetElement.isAccessible() ? "Press Z to interact" : "Solve dependencies first";
      p.text(hint, 300, 250);
      p.pop();
    }
  }
}