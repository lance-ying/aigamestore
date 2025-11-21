import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVELS } from './levels.js';

export class Renderer {
  constructor(p) {
    this.p = p;
  }

  draw() {
    const p = this.p;
    
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        this.drawStartScreen();
        break;
      case GAME_PHASES.PLAYING:
      case GAME_PHASES.PAUSED:
        this.drawGameScreen();
        if (gameState.gamePhase === GAME_PHASES.PAUSED) {
          this.drawPausedOverlay();
        }
        break;
      case GAME_PHASES.LEVEL_COMPLETE:
        this.drawLevelCompleteScreen();
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        this.drawGameOverScreen();
        break;
    }
  }

  drawStartScreen() {
    const p = this.p;
    
    // Background gradient
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
      const c = p.lerpColor(p.color(40, 60, 100), p.color(20, 30, 50), inter);
      p.stroke(c);
      p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Title
    p.fill(255, 220, 100);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("HOTEL DASH", CANVAS_WIDTH / 2, 60);
    
    p.textSize(20);
    p.textStyle(p.NORMAL);
    p.text("P5 Edition", CANVAS_WIDTH / 2, 95);
    
    // Description
    p.fill(220);
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    const desc = "Manage a busy hotel! Check guests into rooms,\nserve food, and keep rooms clean.\nMeet coin targets before time runs out!";
    p.text(desc, CANVAS_WIDTH / 2, 130);
    
    // Instructions
    p.fill(180, 220, 255);
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    const instructions = [
      "CONTROLS:",
      "Arrow Keys - Navigate cursor",
      "Space - Select/Assign tasks",
      "Shift - Cancel selection",
      "Esc - Pause game",
      "R - Restart (from game over)"
    ];
    
    let y = 200;
    instructions.forEach(line => {
      p.text(line, 50, y);
      y += 18;
    });
    
    // How to play
    p.fill(255, 200, 150);
    p.textAlign(p.LEFT, p.TOP);
    const howTo = [
      "HOW TO PLAY:",
      "1. Select waiting guests",
      "2. Assign to service (room/kitchen)",
      "3. Monica cleans dirty rooms",
      "4. Keep guests happy!"
    ];
    
    y = 200;
    howTo.forEach(line => {
      p.text(line, 320, y);
      y += 18;
    });
    
    // Start prompt
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.textStyle(p.BOLD);
    
    // Blinking effect
    const blink = Math.sin(p.frameCount * 0.1) > 0;
    if (blink) {
      p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
    }
  }

  drawGameScreen() {
    const p = this.p;
    
    // Background
    p.background(240, 235, 220);
    
    // Draw hotel layout
    this.drawHotelLayout();
    
    // Draw entities
    gameState.rooms.forEach(room => room.draw());
    gameState.kitchen.draw();
    gameState.reception.draw();
    
    // Draw staff
    gameState.staff.ted.draw();
    gameState.staff.monica.draw();
    
    // Draw guests
    gameState.guests.forEach(guest => guest.draw());
    
    // Draw floating texts
    gameState.floatingTexts.forEach(text => text.draw());
    
    // Draw UI
    this.drawUI();
  }

  drawHotelLayout() {
    const p = this.p;
    
    // Floor
    p.fill(210, 200, 180);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Walls
    p.stroke(100);
    p.strokeWeight(3);
    p.noFill();
    p.rect(20, 40, 100, 170); // Service area
    
    // Guest waiting area
    p.fill(230, 220, 200);
    p.noStroke();
    p.rect(20, 220, 100, 80);
    
    p.fill(100);
    p.textSize(10);
    p.textAlign(p.CENTER, p.TOP);
    p.text("WAITING AREA", 70, 225);
  }

  drawUI() {
    const p = this.p;
    
    // Score
    p.fill(50);
    p.noStroke();
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.textStyle(p.BOLD);
    p.text(`Score: ${gameState.score}/${gameState.targetCoins}`, CANVAS_WIDTH - 10, 10);
    
    // Level
    p.textSize(14);
    p.text(`Level: ${gameState.currentLevel}`, CANVAS_WIDTH - 10, 30);
    
    // Timer
    const timeRemaining = Math.max(0, gameState.levelTimeLimit - gameState.levelTimer);
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    p.textAlign(p.LEFT, p.TOP);
    let timerColor = 50;
    if (timeRemaining < 30000) timerColor = p.color(255, 100, 100);
    else if (timeRemaining < 60000) timerColor = p.color(255, 200, 0);
    
    p.fill(timerColor);
    p.text(`Time: ${timeStr}`, 10, 10);
    
    // Dissatisfied count
    p.fill(50);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.textSize(12);
    p.text(`Dissatisfied: ${gameState.dissatisfiedCount}/${gameState.maxDissatisfied}`, 
           CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
    
    // Guests served
    p.textAlign(p.LEFT, p.BOTTOM);
    p.text(`Served: ${gameState.satisfiedCount}`, 10, CANVAS_HEIGHT - 10);
  }

  drawPausedOverlay() {
    const p = this.p;
    
    p.fill(255, 200, 100);
    p.noStroke();
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.textStyle(p.BOLD);
    p.text("PAUSED", CANVAS_WIDTH - 10, 50);
  }

  drawLevelCompleteScreen() {
    const p = this.p;
    
    // Semi-transparent overlay
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Complete box
    p.fill(100, 200, 100);
    p.stroke(255);
    p.strokeWeight(3);
    p.rect(100, 80, 400, 240);
    
    // Title
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.textStyle(p.BOLD);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 120);
    
    // Stats
    p.textSize(18);
    p.textStyle(p.NORMAL);
    
    const levelData = LEVELS[gameState.currentLevel - 1];
    const timeRemaining = Math.max(0, gameState.levelTimeLimit - gameState.levelTimer);
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    
    p.text(`Level ${gameState.currentLevel}: ${levelData.name}`, CANVAS_WIDTH / 2, 170);
    p.text(`Coins Earned: ${gameState.score}/${gameState.targetCoins}`, CANVAS_WIDTH / 2, 200);
    p.text(`Time Remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 230);
    p.text(`Guests Served: ${gameState.satisfiedCount}`, CANVAS_WIDTH / 2, 260);
    
    // Prompt
    p.fill(255, 255, 100);
    p.textSize(16);
    p.textStyle(p.BOLD);
    const blink = Math.sin(p.frameCount * 0.15) > 0;
    if (blink) {
      p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, 300);
    }
  }

  drawGameOverScreen() {
    const p = this.p;
    
    // Semi-transparent overlay
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Game over box
    const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
    p.fill(...(isWin ? [100, 200, 255] : [255, 100, 100]));
    p.stroke(255);
    p.strokeWeight(3);
    p.rect(100, 80, 400, 240);
    
    // Title
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.textStyle(p.BOLD);
    
    if (isWin) {
      p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 120);
      p.textSize(24);
      p.text("You completed all levels!", CANVAS_WIDTH / 2, 160);
    } else {
      p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
      p.textSize(18);
      p.text("Better luck next time!", CANVAS_WIDTH / 2, 160);
    }
    
    // Final score
    p.textSize(20);
    p.textStyle(p.NORMAL);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 210);
    p.text(`Level Reached: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 240);
    
    // Prompt
    p.fill(255, 255, 100);
    p.textSize(16);
    p.textStyle(p.BOLD);
    const blink = Math.sin(p.frameCount * 0.15) > 0;
    if (blink) {
      p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 290);
    }
  }
}