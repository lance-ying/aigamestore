// panel.js - Panel class and management

import { PANEL_SAFE, PANEL_SPIKE, PANEL_ENEMY, PANEL_GAP, PANEL_EXIT, PANEL_START } from './globals.js';

export class Panel {
  constructor(type, index) {
    this.type = type;
    this.index = index;
    this.width = 120;
    this.height = 100;
    this.x = 0;
    this.y = 0;
    this.selected = false;
    
    // Animation
    this.animationOffset = 0;
    this.enemyOffset = 0;
  }
  
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  
  update(p, frameCount) {
    // Animate enemy movement
    if (this.type === PANEL_ENEMY) {
      this.enemyOffset = Math.sin(frameCount * 0.05) * 10;
    }
    
    // Selection pulse
    if (this.selected) {
      this.animationOffset = Math.sin(frameCount * 0.1) * 2;
    } else {
      this.animationOffset = 0;
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Background
    if (this.selected) {
      p.fill(255, 255, 100);
      p.stroke(255, 200, 0);
    } else {
      p.fill(80, 80, 100);
      p.stroke(50, 50, 70);
    }
    p.strokeWeight(3);
    p.rect(2 + this.animationOffset, 2, this.width - 4, this.height - 4, 5);
    
    // Ground/path
    p.fill(100, 150, 100);
    p.noStroke();
    p.rect(10, this.height - 30, this.width - 20, 20);
    
    // Draw content based on type
    this.drawContent(p);
    
    // Panel number
    p.fill(255, 255, 255, 150);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(10);
    p.text(this.index, 5, 5);
    
    p.pop();
  }
  
  drawContent(p) {
    const centerX = this.width / 2;
    const groundY = this.height - 30;
    
    switch (this.type) {
      case PANEL_START:
        // Draw starting flag
        p.fill(100, 200, 100);
        p.rect(20, groundY - 40, 5, 40);
        p.fill(50, 255, 50);
        p.triangle(25, groundY - 40, 25, groundY - 25, 45, groundY - 32);
        break;
        
      case PANEL_SAFE:
        // Draw safe path with some decoration
        p.fill(150, 200, 150);
        p.ellipse(30, groundY - 15, 8, 8);
        p.ellipse(90, groundY - 15, 8, 8);
        break;
        
      case PANEL_SPIKE:
        // Draw spikes
        p.fill(150, 50, 50);
        for (let i = 0; i < 5; i++) {
          const x = 25 + i * 15;
          p.triangle(x, groundY - 10, x + 7, groundY - 10, x + 3.5, groundY - 25);
        }
        break;
        
      case PANEL_ENEMY:
        // Draw patrolling enemy
        const enemyX = centerX + this.enemyOffset;
        p.fill(200, 50, 50);
        p.ellipse(enemyX, groundY - 20, 20, 20);
        p.fill(255, 100, 100);
        p.ellipse(enemyX - 4, groundY - 23, 5, 5);
        p.ellipse(enemyX + 4, groundY - 23, 5, 5);
        break;
        
      case PANEL_GAP:
        // Draw gap (no ground in middle)
        p.fill(30, 30, 50);
        p.rect(30, groundY, 60, 30);
        break;
        
      case PANEL_EXIT:
        // Draw exit door
        p.fill(200, 150, 50);
        p.rect(centerX - 15, groundY - 35, 30, 35);
        p.fill(100, 70, 20);
        p.rect(centerX - 12, groundY - 32, 24, 29);
        p.fill(255, 200, 0);
        p.ellipse(centerX + 5, groundY - 18, 4, 4);
        break;
    }
  }
  
  isDangerous() {
    return this.type === PANEL_SPIKE || this.type === PANEL_ENEMY || this.type === PANEL_GAP;
  }
  
  isExit() {
    return this.type === PANEL_EXIT;
  }
}

export function createLevelPanels(world, level) {
  const panels = [];
  
  // World 0: Basic levels
  if (world === 0) {
    if (level === 0) {
      // Tutorial level: simple arrangement
      panels.push(new Panel(PANEL_START, 0));
      panels.push(new Panel(PANEL_SAFE, 1));
      panels.push(new Panel(PANEL_SPIKE, 2));
      panels.push(new Panel(PANEL_SAFE, 3));
      panels.push(new Panel(PANEL_EXIT, 4));
    } else if (level === 1) {
      panels.push(new Panel(PANEL_START, 0));
      panels.push(new Panel(PANEL_SPIKE, 1));
      panels.push(new Panel(PANEL_SAFE, 2));
      panels.push(new Panel(PANEL_SPIKE, 3));
      panels.push(new Panel(PANEL_SAFE, 4));
      panels.push(new Panel(PANEL_EXIT, 5));
    } else if (level === 2) {
      panels.push(new Panel(PANEL_START, 0));
      panels.push(new Panel(PANEL_ENEMY, 1));
      panels.push(new Panel(PANEL_SAFE, 2));
      panels.push(new Panel(PANEL_SPIKE, 3));
      panels.push(new Panel(PANEL_SAFE, 4));
      panels.push(new Panel(PANEL_EXIT, 5));
    }
  }
  // World 1: Intermediate
  else if (world === 1) {
    if (level === 0) {
      panels.push(new Panel(PANEL_START, 0));
      panels.push(new Panel(PANEL_SPIKE, 1));
      panels.push(new Panel(PANEL_ENEMY, 2));
      panels.push(new Panel(PANEL_SAFE, 3));
      panels.push(new Panel(PANEL_SAFE, 4));
      panels.push(new Panel(PANEL_SPIKE, 5));
      panels.push(new Panel(PANEL_EXIT, 6));
    } else if (level === 1) {
      panels.push(new Panel(PANEL_START, 0));
      panels.push(new Panel(PANEL_GAP, 1));
      panels.push(new Panel(PANEL_SAFE, 2));
      panels.push(new Panel(PANEL_ENEMY, 3));
      panels.push(new Panel(PANEL_SAFE, 4));
      panels.push(new Panel(PANEL_SPIKE, 5));
      panels.push(new Panel(PANEL_EXIT, 6));
    } else if (level === 2) {
      panels.push(new Panel(PANEL_START, 0));
      panels.push(new Panel(PANEL_ENEMY, 1));
      panels.push(new Panel(PANEL_SPIKE, 2));
      panels.push(new Panel(PANEL_GAP, 3));
      panels.push(new Panel(PANEL_SAFE, 4));
      panels.push(new Panel(PANEL_SAFE, 5));
      panels.push(new Panel(PANEL_ENEMY, 6));
      panels.push(new Panel(PANEL_EXIT, 7));
    }
  }
  // World 2: Advanced
  else if (world === 2) {
    if (level === 0) {
      panels.push(new Panel(PANEL_START, 0));
      panels.push(new Panel(PANEL_SPIKE, 1));
      panels.push(new Panel(PANEL_ENEMY, 2));
      panels.push(new Panel(PANEL_SAFE, 3));
      panels.push(new Panel(PANEL_GAP, 4));
      panels.push(new Panel(PANEL_SPIKE, 5));
      panels.push(new Panel(PANEL_SAFE, 6));
      panels.push(new Panel(PANEL_EXIT, 7));
    } else if (level === 1) {
      panels.push(new Panel(PANEL_START, 0));
      panels.push(new Panel(PANEL_GAP, 1));
      panels.push(new Panel(PANEL_ENEMY, 2));
      panels.push(new Panel(PANEL_SPIKE, 3));
      panels.push(new Panel(PANEL_SAFE, 4));
      panels.push(new Panel(PANEL_ENEMY, 5));
      panels.push(new Panel(PANEL_SAFE, 6));
      panels.push(new Panel(PANEL_SPIKE, 7));
      panels.push(new Panel(PANEL_EXIT, 8));
    } else if (level === 2) {
      panels.push(new Panel(PANEL_START, 0));
      panels.push(new Panel(PANEL_ENEMY, 1));
      panels.push(new Panel(PANEL_GAP, 2));
      panels.push(new Panel(PANEL_SPIKE, 3));
      panels.push(new Panel(PANEL_SAFE, 4));
      panels.push(new Panel(PANEL_ENEMY, 5));
      panels.push(new Panel(PANEL_GAP, 6));
      panels.push(new Panel(PANEL_SAFE, 7));
      panels.push(new Panel(PANEL_SPIKE, 8));
      panels.push(new Panel(PANEL_EXIT, 9));
    }
  }
  
  // Shuffle panels (except start and exit)
  if (panels.length > 2) {
    const middle = panels.slice(1, panels.length - 1);
    for (let i = middle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [middle[i], middle[j]] = [middle[j], middle[i]];
    }
    // Reassemble
    const shuffled = [panels[0], ...middle, panels[panels.length - 1]];
    // Update indices
    shuffled.forEach((panel, idx) => {
      panel.index = idx;
    });
    return shuffled;
  }
  
  return panels;
}