// ui.js - User interface rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class UI {
  constructor(p) {
    this.p = p;
  }
  
  renderStartScreen() {
    this.p.background(0);
    
    // Title with evolving effect
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    
    // Main title
    this.p.fill(100, 200, 255);
    this.p.textSize(48);
    this.p.text("EVOLAND", CANVAS_WIDTH / 2, 80);
    
    // Subtitle with animation
    const pulse = this.p.sin(this.p.frameCount * 0.05) * 10 + 245;
    this.p.fill(pulse, pulse, 100);
    this.p.textSize(16);
    this.p.text("A World That Evolves", CANVAS_WIDTH / 2, 130);
    
    // Description
    this.p.fill(200);
    this.p.textSize(12);
    this.p.textAlign(this.p.CENTER, this.p.TOP);
    const desc = [
      "Your adventure begins in a primitive world.",
      "Discover EVOLUTION CHESTS to unlock new features:",
      "• Color Graphics",
      "• Scrolling Camera",
      "• Advanced Combat",
      "",
      "Defeat enemies, collect treasures, and conquer the boss!"
    ];
    
    let yPos = 170;
    for (let line of desc) {
      this.p.text(line, CANVAS_WIDTH / 2, yPos);
      yPos += 18;
    }
    
    // Controls
    this.p.fill(150, 200, 255);
    this.p.textSize(14);
    yPos += 10;
    this.p.text("CONTROLS:", CANVAS_WIDTH / 2, yPos);
    yPos += 20;
    
    this.p.fill(180);
    this.p.textSize(11);
    const controls = [
      "Arrow Keys: Move",
      "Space: Attack / Open Chests",
      "Z: Dodge Roll (unlocked later)",
      "ESC: Pause",
      "R: Restart (from game over)"
    ];
    
    for (let line of controls) {
      this.p.text(line, CANVAS_WIDTH / 2, yPos);
      yPos += 16;
    }
    
    // Start prompt
    const startPulse = this.p.sin(this.p.frameCount * 0.1) * 50 + 200;
    this.p.fill(startPulse, 255, startPulse);
    this.p.textSize(16);
    this.p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
  
  renderGame() {
    // HUD overlay
    this.p.push();
    
    // Health bar (top left)
    const player = gameState.player;
    if (player) {
      const barWidth = 150;
      const barHeight = 20;
      const x = 10;
      const y = 10;
      
      // Background
      this.p.fill(0, 0, 0, 150);
      this.p.noStroke();
      this.p.rect(x, y, barWidth + 10, barHeight + 20, 5);
      
      // Label
      this.p.fill(255);
      this.p.textAlign(this.p.LEFT, this.p.TOP);
      this.p.textSize(12);
      this.p.text("HP", x + 5, y + 5);
      
      // Health bar
      this.p.fill(100, 0, 0);
      this.p.rect(x + 5, y + 20, barWidth, barHeight);
      
      const hpPercent = player.hp / player.maxHP;
      const hpColor = hpPercent > 0.5 ? [0, 255, 100] : 
                      hpPercent > 0.25 ? [255, 200, 0] : [255, 50, 50];
      this.p.fill(...hpColor);
      this.p.rect(x + 5, y + 20, barWidth * hpPercent, barHeight);
      
      // HP text
      this.p.fill(255);
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(11);
      this.p.text(`${Math.ceil(player.hp)} / ${player.maxHP}`, x + 5 + barWidth / 2, y + 20 + barHeight / 2);
    }
    
    // Score (top right)
    this.p.fill(0, 0, 0, 150);
    this.p.noStroke();
    this.p.rect(CANVAS_WIDTH - 120, 10, 110, 35, 5);
    
    this.p.fill(255, 215, 0);
    this.p.textAlign(this.p.RIGHT, this.p.TOP);
    this.p.textSize(14);
    this.p.text("SCORE", CANVAS_WIDTH - 15, 15);
    this.p.textSize(16);
    this.p.text(gameState.score, CANVAS_WIDTH - 15, 30);
    
    // Evolution status (bottom left)
    this.p.fill(0, 0, 0, 150);
    this.p.noStroke();
    const evolutionBoxHeight = 70;
    this.p.rect(10, CANVAS_HEIGHT - evolutionBoxHeight - 10, 180, evolutionBoxHeight, 5);
    
    this.p.fill(200);
    this.p.textAlign(this.p.LEFT, this.p.TOP);
    this.p.textSize(12);
    this.p.text("EVOLUTION:", 15, CANVAS_HEIGHT - evolutionBoxHeight - 5);
    
    const features = [
      { name: "Color", unlocked: gameState.hasColor },
      { name: "Scrolling", unlocked: gameState.hasScrolling },
      { name: "Combat+", unlocked: gameState.hasAdvancedCombat }
    ];
    
    let yPos = CANVAS_HEIGHT - evolutionBoxHeight + 12;
    for (let feature of features) {
      if (feature.unlocked) {
        this.p.fill(100, 255, 150);
        this.p.text(`✓ ${feature.name}`, 15, yPos);
      } else {
        this.p.fill(100);
        this.p.text(`○ ${feature.name}`, 15, yPos);
      }
      yPos += 16;
    }
    
    // Dodge cooldown indicator (if unlocked)
    if (gameState.hasAdvancedCombat && player) {
      const dodgeCooldownPercent = 1 - (player.dodgeCooldown / 60);
      const dodgeX = CANVAS_WIDTH - 120;
      const dodgeY = CANVAS_HEIGHT - 50;
      
      this.p.fill(0, 0, 0, 150);
      this.p.rect(dodgeX, dodgeY, 110, 40, 5);
      
      this.p.fill(150);
      this.p.textAlign(this.p.LEFT, this.p.TOP);
      this.p.textSize(11);
      this.p.text("DODGE (Z)", dodgeX + 5, dodgeY + 5);
      
      // Cooldown bar
      this.p.fill(60);
      this.p.rect(dodgeX + 5, dodgeY + 22, 100, 10);
      
      if (dodgeCooldownPercent >= 1) {
        this.p.fill(100, 255, 150);
      } else {
        this.p.fill(255, 150, 0);
      }
      this.p.rect(dodgeX + 5, dodgeY + 22, 100 * dodgeCooldownPercent, 10);
    }
    
    // Paused indicator
    if (gameState.gamePhase === "PAUSED") {
      this.p.fill(255);
      this.p.textAlign(this.p.RIGHT, this.p.TOP);
      this.p.textSize(14);
      this.p.text("PAUSED", CANVAS_WIDTH - 10, 60);
    }
    
    this.p.pop();
  }
  
  renderGameOver() {
    // Semi-transparent overlay
    this.p.fill(0, 0, 0, 200);
    this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
      // Victory screen
      this.p.fill(100, 255, 150);
      this.p.textSize(48);
      this.p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
      
      this.p.fill(255, 215, 0);
      this.p.textSize(24);
      this.p.text("You defeated the boss!", CANVAS_WIDTH / 2, 170);
      
      this.p.fill(200);
      this.p.textSize(16);
      this.p.text("Your world has fully evolved!", CANVAS_WIDTH / 2, 210);
    } else {
      // Game over screen
      this.p.fill(255, 100, 100);
      this.p.textSize(48);
      this.p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
      
      this.p.fill(200);
      this.p.textSize(20);
      this.p.text("You were defeated...", CANVAS_WIDTH / 2, 170);
    }
    
    // Final stats
    this.p.fill(180);
    this.p.textSize(16);
    this.p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
    this.p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 255);
    this.p.text(`Chests Opened: ${gameState.chestsOpened}`, CANVAS_WIDTH / 2, 280);
    
    // Restart prompt
    const pulse = this.p.sin(this.p.frameCount * 0.1) * 50 + 200;
    this.p.fill(pulse, pulse, 255);
    this.p.textSize(18);
    this.p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}