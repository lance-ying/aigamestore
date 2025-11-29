// level.js - Level generation and management

import { gameState, CANVAS_HEIGHT, LEVEL_WIDTH } from './globals.js';
import { Platform, Ring, Enemy, Spring, Loop } from './entities.js';

// Generate level
export function generateLevel() {
  // Clear existing level
  gameState.platforms = [];
  gameState.rings = [];
  gameState.enemies = [];
  gameState.springs = [];
  gameState.loops = [];
  
  // Ground platform
  const groundY = CANVAS_HEIGHT - 50;
  new Platform(0, groundY, LEVEL_WIDTH, 50, 'grass');
  
  // Starting platform
  new Platform(50, groundY - 100, 200, 20, 'normal');
  
  // Platforming section with rings
  for (let i = 0; i < 10; i++) {
    const x = 300 + i * 200;
    const y = groundY - 100 - Math.sin(i * 0.5) * 80;
    new Platform(x, y, 120, 20, 'normal');
    
    // Add rings above platforms
    for (let j = 0; j < 5; j++) {
      new Ring(x + 20 + j * 20, y - 30);
    }
    
    // Add enemy on some platforms
    if (i % 3 === 0) {
      new Enemy(x + 60, y - 30);
    }
  }
  
  // Spring section
  new Spring(2300, groundY - 15, 'yellow');
  new Spring(2400, groundY - 200, 'red');
  
  // Ring trail in the air
  for (let i = 0; i < 20; i++) {
    const x = 1500 + i * 30;
    const y = groundY - 200 - Math.sin(i * 0.3) * 50;
    new Ring(x, y);
  }
  
  // Loop section
  new Loop(2000, groundY - 150, 100);
  
  // Elevated platforms section
  for (let i = 0; i < 5; i++) {
    const x = 2600 + i * 150;
    const y = groundY - 150 - i * 30;
    new Platform(x, y, 100, 20, 'stone');
    
    // Rings
    for (let j = 0; j < 3; j++) {
      new Ring(x + 20 + j * 30, y - 30);
    }
  }
  
  // Final approach with enemies
  for (let i = 0; i < 5; i++) {
    const x = 2500 + i * 100;
    new Enemy(x, groundY - 30);
  }
  
  // Goal platform
  new Platform(LEVEL_WIDTH - 200, groundY - 100, 150, 20, 'goal');
  
  // Goal post visual (just a platform for now)
  new Platform(LEVEL_WIDTH - 100, groundY - 200, 20, 200, 'goal');
}

// Generate special stage
export function generateSpecialStage() {
  gameState.specialStageRings = [];
  
  // Create rings in a 3D half-pipe pattern
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = CANVAS_WIDTH / 2 + Math.cos(angle) * 150;
    const y = CANVAS_HEIGHT / 2 + Math.sin(angle) * 100;
    const z = 500 + i * 100;
    
    // Create special stage ring (we'll use a simplified version)
    gameState.specialStageRings.push({
      x: x,
      y: y,
      z: z,
      radius: 20,
      collected: false,
      
      update() {
        this.z -= 5;
        
        // Check collision with player
        if (gameState.player && !this.collected) {
          const scale = 500 / (this.z + 500);
          const screenX = CANVAS_WIDTH / 2 + (this.x - CANVAS_WIDTH / 2) * scale;
          const screenY = CANVAS_HEIGHT / 2 + (this.y - CANVAS_HEIGHT / 2) * scale;
          
          const dx = screenX - CANVAS_WIDTH / 2;
          const dy = screenY - CANVAS_HEIGHT / 2;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 30) {
            this.collected = true;
            gameState.score += 50;
            
            // Check completion
            const remaining = gameState.specialStageRings.filter(r => !r.collected).length;
            if (remaining === 0) {
              gameState.chaosEmeralds++;
              gameState.score += 5000;
              gameState.specialStageComplete = true;
            }
          }
        }
        
        // Remove if behind player
        if (this.z < 0) {
          this.remove = true;
        }
      },
      
      render(p) {
        if (this.collected) return;
        
        const scale = 500 / (this.z + 500);
        const screenX = CANVAS_WIDTH / 2 + (this.x - CANVAS_WIDTH / 2) * scale;
        const screenY = CANVAS_HEIGHT / 2 + (this.y - CANVAS_HEIGHT / 2) * scale;
        const size = this.radius * scale;
        
        p.push();
        p.fill(255, 215, 0, 200);
        p.stroke(255, 180, 0);
        p.strokeWeight(2);
        p.ellipse(screenX, screenY, size * 2, size * 2);
        p.pop();
      }
    });
  }
  
  // Remove rings that need removal
  gameState.specialStageRings = gameState.specialStageRings.filter(r => !r.remove);
}