// player.js
import { gameState } from './globals.js';

export class Player {
  constructor() {
    this.color = [255, 100, 100];
    this.size = 20;
  }
  
  update(p, board) {
    // Handle movement animation
    if (gameState.moving) {
      gameState.moveProgress += 0.05;
      
      if (gameState.moveProgress >= 1.0) {
        gameState.currentSpace++;
        
        if (gameState.currentSpace >= gameState.targetSpace) {
          gameState.moving = false;
          gameState.moveProgress = 0;
          this.handleLanding(p);
        } else {
          gameState.moveProgress = 0;
        }
      }
    }
  }
  
  handleLanding(p) {
    const spaceType = gameState.spaceTypes[gameState.currentSpace];
    
    // Log player position
    const pos = this.getPosition();
    p.logs.player_info.push({
      screen_x: pos.x,
      screen_y: pos.y,
      game_x: gameState.currentSpace,
      game_y: 0,
      framecount: p.frameCount
    });
    
    if (spaceType === "FINISH") {
      gameState.memories += 50;
      gameState.score += 50;
      gameState.gamePhase = "GAME_OVER_WIN";
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (spaceType === "SOUVENIR") {
      gameState.souvenirs++;
      gameState.memories += 10;
      gameState.score += 10;
      gameState.currentMessage = "Found a souvenir! +10 memories";
      gameState.messageTimer = 120;
    } else if (spaceType === "PHOTO") {
      gameState.photos++;
      gameState.memories += 8;
      gameState.score += 8;
      gameState.currentMessage = "Took a photo! +8 memories";
      gameState.messageTimer = 120;
    } else if (spaceType === "MINIGAME") {
      this.startMinigame();
    } else if (spaceType === "BONUS") {
      const bonus = Math.floor(Math.random() * 10) + 5;
      gameState.memories += bonus;
      gameState.score += bonus;
      gameState.currentMessage = `Bonus space! +${bonus} memories`;
      gameState.messageTimer = 120;
    } else {
      gameState.memories += 1;
      gameState.score += 1;
      gameState.currentMessage = "Advanced! +1 memory";
      gameState.messageTimer = 90;
    }
  }
  
  startMinigame() {
    const types = ["SCUBA", "SANDCASTLE", "SURFING"];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    gameState.minigameActive = true;
    gameState.minigameType = randomType;
    gameState.minigameScore = 0;
    gameState.minigameTimer = 180; // 3 seconds at 60fps
    gameState.minigameTargets = [];
    
    // Initialize minigame targets
    if (randomType === "SCUBA") {
      for (let i = 0; i < 8; i++) {
        gameState.minigameTargets.push({
          x: Math.random() * 500 + 50,
          y: Math.random() * 300 + 50,
          caught: false,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3
        });
      }
    } else if (randomType === "SANDCASTLE") {
      gameState.minigameTargets = [{ progress: 0, maxProgress: 100 }];
    } else if (randomType === "SURFING") {
      for (let i = 0; i < 10; i++) {
        gameState.minigameTargets.push({
          x: 600 + i * 100,
          y: Math.random() * 200 + 100,
          hit: false
        });
      }
    }
    
    gameState.currentMessage = `Minigame: ${randomType}!`;
    gameState.messageTimer = 60;
  }
  
  getPosition() {
    const currentPos = gameState.boardPath[gameState.currentSpace];
    
    if (!gameState.moving) {
      return currentPos;
    }
    
    const nextPos = gameState.boardPath[gameState.currentSpace + 1] || currentPos;
    return {
      x: currentPos.x + (nextPos.x - currentPos.x) * gameState.moveProgress,
      y: currentPos.y + (nextPos.y - currentPos.y) * gameState.moveProgress
    };
  }
  
  draw(p) {
    const pos = this.getPosition();
    
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(pos.x + 2, pos.y + 2, this.size, this.size * 0.5);
    
    // Player peg
    p.fill(...this.color);
    p.stroke(150, 50, 50);
    p.strokeWeight(2);
    p.circle(pos.x, pos.y, this.size);
    
    // Face
    p.fill(255);
    p.noStroke();
    p.circle(pos.x - 3, pos.y - 2, 4);
    p.circle(pos.x + 3, pos.y - 2, 4);
    p.fill(0);
    p.circle(pos.x - 3, pos.y - 2, 2);
    p.circle(pos.x + 3, pos.y - 2, 2);
    
    // Smile
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    p.arc(pos.x, pos.y + 2, 8, 6, 0, p.PI);
    
    p.pop();
  }
}