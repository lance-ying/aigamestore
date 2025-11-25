import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

export class Renderer {
  constructor(p) {
    this.p = p;
  }

  render() {
    const p = this.p;
    
    // Background
    p.background(45, 55, 75);
    
    switch (gameState.gamePhase) {
      case PHASE_START:
        this.renderStartScreen();
        break;
      case PHASE_PLAYING:
        this.renderPlayingScreen();
        break;
      case PHASE_PAUSED:
        this.renderPlayingScreen();
        this.renderPauseOverlay();
        break;
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        this.renderGameOverScreen();
        break;
    }
  }

  renderStartScreen() {
    const p = this.p;
    
    // Animated background
    for (let i = 0; i < 5; i++) {
      const alpha = 20 + p.sin(p.frameCount * 0.02 + i) * 10;
      p.fill(100, 150, 200, alpha);
      p.noStroke();
      const size = 100 + i * 50;
      p.circle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, size);
    }
    
    // Title
    p.fill(255, 230, 100);
    p.stroke(50, 40, 20);
    p.strokeWeight(4);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.textStyle(p.BOLD);
    p.text("GUESS THE WORD!", CANVAS_WIDTH / 2, 60);
    p.textStyle(p.NORMAL);
    
    // Subtitle
    p.noStroke();
    p.fill(255, 255, 255);
    p.textSize(18);
    p.text("Single-Player Guessing Game", CANVAS_WIDTH / 2, 110);
    
    // Description box
    p.fill(255, 255, 255, 230);
    p.stroke(100, 150, 200);
    p.strokeWeight(2);
    p.rect(50, 140, CANVAS_WIDTH - 100, 120, 10);
    
    // Description text
    p.noStroke();
    p.fill(40);
    p.textSize(16);
    p.textAlign(p.CENTER, p.TOP);
    const desc = "Each card shows a CHARACTER and an ACTION.\nGuess as many combinations as you can in 60 seconds!\nPress UP ARROW when you know it (correct guess).\nPress DOWN ARROW to skip difficult ones.\nGet " + gameState.score + " or more correct to win!";
    p.text(desc, CANVAS_WIDTH / 2, 155, CANVAS_WIDTH - 120);
    
    // Controls
    p.fill(255, 255, 255, 230);
    p.stroke(100, 200, 150);
    p.strokeWeight(2);
    p.rect(50, 280, CANVAS_WIDTH - 100, 70, 10);
    
    p.noStroke();
    p.fill(40);
    p.textSize(15);
    p.text("CONTROLS:", CANVAS_WIDTH / 2, 290);
    p.textSize(13);
    p.text("↑ UP: Correct Guess  |  ↓ DOWN: Skip  |  ESC: Pause", CANVAS_WIDTH / 2, 315);
    
    // Press ENTER prompt (pulsing)
    const pulseAlpha = 200 + p.sin(p.frameCount * 0.1) * 55;
    p.fill(255, 215, 0, pulseAlpha);
    p.textSize(24);
    p.textStyle(p.BOLD);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
    p.textStyle(p.NORMAL);
  }

  renderPlayingScreen() {
    const p = this.p;
    
    // Gradient background
    for (let y = 0; y < CANVAS_HEIGHT; y += 2) {
      const inter = y / CANVAS_HEIGHT;
      const c = p.lerpColor(p.color(45, 55, 75), p.color(25, 35, 55), inter);
      p.stroke(c);
      p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Render current card
    if (gameState.currentCard) {
      const animScale = 1 - gameState.cardChangeAnimation * 0.2;
      gameState.currentCard.render(
        CANVAS_WIDTH / 2, 
        CANVAS_HEIGHT / 2, 
        animScale,
        gameState.cardChangeAnimation
      );
    }
    
    // HUD Background
    p.fill(20, 30, 40, 200);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 50);
    
    // Score
    p.fill(255, 215, 0);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(20);
    p.textStyle(p.BOLD);
    p.text(`Score: ${gameState.score}`, 20, 25);
    
    // Skips
    p.fill(200, 150, 255);
    p.text(`Skips: ${gameState.skips}`, 180, 25);
    
    // Time remaining
    const timeColor = gameState.timeRemaining < 10 ? [255, 100, 100] : [100, 255, 150];
    p.fill(...timeColor);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`Time: ${Math.ceil(gameState.timeRemaining)}s`, CANVAS_WIDTH - 20, 25);
    p.textStyle(p.NORMAL);
    
    // Timer bar
    const barWidth = (gameState.timeRemaining / 60) * (CANVAS_WIDTH - 40);
    p.fill(100, 255, 150, 100);
    p.rect(20, 40, barWidth, 6, 3);
  }

  renderPauseOverlay() {
    const p = this.p;
    
    // Semi-transparent overlay
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Pause text
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(18);
    p.textStyle(p.BOLD);
    p.text("PAUSED", CANVAS_WIDTH - 15, 15);
    p.textStyle(p.NORMAL);
    
    // Instructions
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text("Game Paused", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    p.textSize(16);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }

  renderGameOverScreen() {
    const p = this.p;
    
    // Animated background
    for (let i = 0; i < 8; i++) {
      const alpha = 15 + p.sin(p.frameCount * 0.03 + i) * 8;
      const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
      const baseColor = isWin ? p.color(100, 200, 100) : p.color(200, 100, 100);
      p.fill(p.red(baseColor), p.green(baseColor), p.blue(baseColor), alpha);
      p.noStroke();
      const size = 80 + i * 40;
      p.circle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, size);
    }
    
    // Result message
    const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
    p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
    p.stroke(50);
    p.strokeWeight(4);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text(isWin ? "YOU WIN!" : "TIME'S UP!", CANVAS_WIDTH / 2, 80);
    p.textStyle(p.NORMAL);
    
    // Stats box
    p.fill(255, 255, 255, 240);
    p.stroke(100);
    p.strokeWeight(3);
    p.rect(100, 140, CANVAS_WIDTH - 200, 160, 15);
    
    // Stats
    p.noStroke();
    p.fill(40);
    p.textSize(28);
    p.textStyle(p.BOLD);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
    p.textStyle(p.NORMAL);
    
    p.textSize(18);
    p.text(`Correct Guesses: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
    p.text(`Skips: ${gameState.skips}`, CANVAS_WIDTH / 2, 245);
    p.text(`Cards Shown: ${gameState.totalCardsShown}`, CANVAS_WIDTH / 2, 270);
    
    // Win condition info
    if (!isWin) {
      p.fill(200, 50, 50);
      p.textSize(14);
      p.text(`(Need 15+ correct to win)`, CANVAS_WIDTH / 2, 295);
    }
    
    // Restart prompt
    const pulseAlpha = 200 + p.sin(p.frameCount * 0.1) * 55;
    p.fill(255, 215, 0, pulseAlpha);
    p.textSize(22);
    p.textStyle(p.BOLD);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
    p.textStyle(p.NORMAL);
  }
}