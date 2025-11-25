// rendering.js - Rendering functions

import { gameState, GAME_PHASES, PLAY_MODES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderGame(p) {
  p.background(30, 20, 40);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.playMode === PLAY_MODES.TRAINING || gameState.playMode === "feed_menu") {
      renderTrainingMode(p);
    } else if (gameState.playMode === PLAY_MODES.BATTLE) {
      renderBattleMode(p);
    }
    
    // Render message if any
    if (gameState.message) {
      renderMessage(p);
    }
    
    // Paused indicator
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      p.fill(255);
      p.stroke(0);
      p.strokeWeight(2);
      p.textAlign(p.RIGHT, p.TOP);
      p.textSize(16);
      p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    }
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    // Still render the game underneath
    if (gameState.playMode === PLAY_MODES.TRAINING || gameState.playMode === "feed_menu") {
      renderTrainingMode(p);
    } else if (gameState.playMode === PLAY_MODES.BATTLE) {
      renderBattleMode(p);
    }
    
    // Paused overlay
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(2);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  // Background gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(60, 20, 80), p.color(20, 10, 40), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Title with glow effect
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  for (let i = 0; i < 3; i++) {
    p.fill(255, 150, 200, 50);
    p.noStroke();
    p.textSize(60 + i * 4);
    p.text("DRAPLINE", CANVAS_WIDTH / 2, 80);
  }
  
  // Main title
  p.fill(255, 200, 255);
  p.stroke(100, 50, 150);
  p.strokeWeight(3);
  p.textSize(60);
  p.text("DRAPLINE", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 180, 255);
  p.stroke(50, 30, 100);
  p.strokeWeight(2);
  p.textSize(16);
  p.text("Dragon Girl Training Roguelite", CANVAS_WIDTH / 2, 130);
  
  // Description box
  p.fill(40, 30, 60, 200);
  p.stroke(150, 100, 200);
  p.strokeWeight(2);
  p.rect(50, 160, CANVAS_WIDTH - 100, 140, 10);
  
  // Description text
  p.fill(255);
  p.noStroke();
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  const desc = [
    "Raise a dragon girl by feeding her various items",
    "to build her strength over one year (365 days).",
    "",
    "Feed her to increase stats, battle enemies to gain",
    "experience and gold, then defeat the final boss",
    "before time runs out to save the world!"
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], 70, 175 + i * 18);
  }
  
  // Controls box
  p.fill(40, 30, 60, 200);
  p.stroke(150, 100, 200);
  p.strokeWeight(2);
  p.rect(50, 315, CANVAS_WIDTH - 100, 60, 10);
  
  p.fill(255, 220, 150);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 325);
  
  p.textSize(11);
  p.text("↑↓: Navigate Menu | SPACE: Select | Z: Cancel/Back", CANVAS_WIDTH / 2, 345);
  p.text("ESC: Pause | R: Restart", CANVAS_WIDTH / 2, 360);
  
  // Press ENTER prompt with animation
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, 200, 255);
  p.stroke(100, 50, 150);
  p.strokeWeight(2);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 390);
}

function renderTrainingMode(p) {
  // Background
  p.background(80, 120, 160);
  
  // Ground
  p.fill(60, 140, 80);
  p.noStroke();
  p.rect(0, 300, CANVAS_WIDTH, 100);
  
  // Sky details
  p.fill(255, 255, 200, 150);
  p.ellipse(500, 80, 60, 60); // Sun
  
  // Clouds
  p.fill(255, 255, 255, 180);
  p.ellipse(100, 100, 60, 30);
  p.ellipse(130, 95, 50, 25);
  p.ellipse(350, 120, 70, 35);
  p.ellipse(380, 115, 60, 30);
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // UI Panel
  p.fill(40, 30, 60, 220);
  p.stroke(150, 100, 200);
  p.strokeWeight(2);
  p.rect(320, 20, 260, CANVAS_HEIGHT - 40, 10);
  
  // Stats header
  p.fill(255, 200, 255);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text("Dragon Stats", 450, 30);
  
  // Stats
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.fill(255);
  let yPos = 60;
  p.text(`Level: ${gameState.player.level}`, 330, yPos);
  yPos += 18;
  p.text(`HP: ${Math.floor(gameState.player.hp)}/${gameState.player.maxHP}`, 330, yPos);
  yPos += 18;
  p.text(`Attack: ${gameState.player.attack}`, 330, yPos);
  yPos += 18;
  p.text(`Defense: ${gameState.player.defense}`, 330, yPos);
  yPos += 18;
  p.text(`EXP: ${gameState.player.experience}/${gameState.player.level * 50}`, 330, yPos);
  yPos += 25;
  
  // Divider
  p.stroke(150, 100, 200);
  p.strokeWeight(1);
  p.line(330, yPos, 570, yPos);
  yPos += 10;
  
  // Menu items
  if (gameState.playMode === PLAY_MODES.TRAINING) {
    p.textSize(14);
    p.fill(255, 220, 150);
    p.noStroke();
    p.text("Training Menu", 330, yPos);
    yPos += 25;
  } else {
    p.textSize(14);
    p.fill(255, 220, 150);
    p.noStroke();
    p.text("Food Shop", 330, yPos);
    yPos += 25;
  }
  
  for (let i = 0; i < gameState.menuItems.length; i++) {
    const item = gameState.menuItems[i];
    const selected = i === gameState.selectedMenuItem;
    
    if (item.type === "info") {
      p.fill(180, 180, 200);
      p.textSize(11);
      p.text(item.label, 340, yPos);
    } else {
      if (selected) {
        p.fill(255, 200, 100);
        p.noStroke();
        p.rect(325, yPos - 2, 250, 18, 3);
      }
      
      p.fill(...(selected ? [0, 0, 0] : [255, 255, 255]));
      p.textSize(12);
      p.text(selected ? `> ${item.label}` : item.label, 335, yPos);
      
      // Show cost for food items
      if (item.type === "food") {
        const canAfford = gameState.gold >= item.food.cost;
        p.fill(...(canAfford ? [100, 255, 100] : [255, 100, 100]));
        p.text(`${item.food.cost}g`, 520, yPos);
      }
    }
    yPos += 20;
  }
  
  // Skills section
  if (gameState.playMode === PLAY_MODES.TRAINING) {
    yPos += 10;
    p.stroke(150, 100, 200);
    p.strokeWeight(1);
    p.line(330, yPos, 570, yPos);
    yPos += 10;
    
    p.fill(255, 220, 150);
    p.noStroke();
    p.textSize(14);
    p.text("Skills Learned", 330, yPos);
    yPos += 20;
    
    p.textSize(10);
    p.fill(255);
    for (const skill of gameState.player.skills) {
      p.text(`• ${skill.name}`, 340, yPos);
      yPos += 14;
    }
  }
}

function renderBattleMode(p) {
  // Battle background
  p.background(60, 40, 80);
  
  // Battle ground
  p.fill(80, 60, 100);
  p.noStroke();
  p.rect(0, 300, CANVAS_WIDTH, 100);
  
  // Background effects
  for (let i = 0; i < 5; i++) {
    p.fill(100, 80, 150, 50);
    p.ellipse(p.random(CANVAS_WIDTH), p.random(200), 100, 100);
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render enemy
  if (gameState.currentEnemy) {
    gameState.currentEnemy.render(p);
  }
  
  // Battle UI
  p.fill(20, 10, 40, 230);
  p.stroke(200, 150, 255);
  p.strokeWeight(2);
  p.rect(20, CANVAS_HEIGHT - 120, CANVAS_WIDTH - 40, 100, 10);
  
  // Turn indicator
  p.fill(255, 220, 150);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  const turnText = gameState.battleTurn === "player" ? "Your Turn!" : "Enemy Turn...";
  p.text(turnText, 30, CANVAS_HEIGHT - 110);
  
  // Skills list
  if (gameState.battleTurn === "player") {
    p.textSize(12);
    p.fill(255);
    let xPos = 30;
    let yPos = CANVAS_HEIGHT - 85;
    
    for (let i = 0; i < gameState.player.skills.length; i++) {
      const skill = gameState.player.skills[i];
      const selected = i === gameState.selectedSkill;
      
      if (selected) {
        p.fill(255, 200, 100);
        p.noStroke();
        p.rect(xPos - 5, yPos - 2, 180, 35, 5);
      }
      
      p.fill(...(selected ? [0, 0, 0] : [255, 255, 255]));
      p.textSize(13);
      p.text(skill.name, xPos, yPos);
      p.textSize(10);
      p.fill(...(selected ? [50, 50, 50] : [180, 180, 180]));
      
      let info = "";
      if (skill.type === "attack") {
        info = `DMG: ${skill.damage + gameState.player.attack}`;
      } else if (skill.type === "heal") {
        info = `HEAL: ${skill.heal}`;
      } else if (skill.type === "defense") {
        info = `DEF: +${skill.defense}`;
      }
      p.text(info, xPos, yPos + 15);
      
      xPos += 190;
      if (xPos > CANVAS_WIDTH - 200) {
        xPos = 30;
        yPos += 40;
      }
    }
    
    // Instructions
    p.fill(200, 200, 255);
    p.textSize(11);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.text("↑↓: Select Skill | SPACE: Use Skill", CANVAS_WIDTH - 30, CANVAS_HEIGHT - 25);
  }
}

function renderGameOverScreen(p) {
  // Background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c1 = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ? 
               p.color(100, 200, 255) : p.color(80, 20, 20);
    const c2 = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ? 
               p.color(50, 100, 200) : p.color(40, 10, 10);
    const c = p.lerpColor(c1, c2, inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  const title = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ? "VICTORY!" : "DEFEAT...";
  const titleColor = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ? 
                     [255, 255, 100] : [255, 100, 100];
  
  // Glow
  for (let i = 0; i < 3; i++) {
    p.fill(...titleColor, 30);
    p.noStroke();
    p.textSize(70 + i * 5);
    p.text(title, CANVAS_WIDTH / 2, 100);
  }
  
  p.fill(...titleColor);
  p.stroke(100, 50, 0);
  p.strokeWeight(3);
  p.textSize(70);
  p.text(title, CANVAS_WIDTH / 2, 100);
  
  // Message
  p.fill(255);
  p.noStroke();
  p.textSize(16);
  let message = "";
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    if (gameState.bossDefeated) {
      message = "You defeated the World Catastrophe!\nThe dragon girl saved the world!";
    } else {
      message = "Congratulations!";
    }
  } else {
    message = "The dragon girl was not strong enough...\nThe world has fallen to catastrophe.";
  }
  p.text(message, CANVAS_WIDTH / 2, 180);
  
  // Stats box
  p.fill(30, 20, 50, 200);
  p.stroke(200, 150, 255);
  p.strokeWeight(2);
  p.rect(150, 230, 300, 120, 10);
  
  p.fill(255, 220, 150);
  p.noStroke();
  p.textSize(18);
  p.text("Final Stats", CANVAS_WIDTH / 2, 245);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  let yPos = 270;
  p.text(`Days Survived: ${gameState.day}`, 170, yPos);
  yPos += 20;
  p.text(`Final Level: ${gameState.player.level}`, 170, yPos);
  yPos += 20;
  p.text(`Enemies Defeated: ${gameState.defeatedEnemies}`, 170, yPos);
  yPos += 20;
  p.text(`Final Score: ${gameState.score}`, 170, yPos);
  
  // Restart prompt
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, 200, 255);
  p.stroke(100, 50, 150);
  p.strokeWeight(2);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 380);
}

function renderMessage(p) {
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(50, 20, CANVAS_WIDTH - 100, 40, 5);
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(gameState.message, CANVAS_WIDTH / 2, 40);
}