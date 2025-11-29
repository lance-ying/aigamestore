// rendering.js - Visual rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { getChapterData, getSceneData } from './story_data.js';

export function drawStartScreen(p) {
  // Animated background
  drawAnimatedBackground(p, 'palace');
  
  // Title
  p.push();
  p.fill(220, 180, 80);
  p.strokeWeight(3);
  p.stroke(80, 40, 20);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("盛世天下～女帝への道～", CANVAS_WIDTH / 2, 60);
  p.textSize(18);
  p.fill(200, 160, 60);
  p.text("Path to Empress", CANVAS_WIDTH / 2, 90);
  p.pop();
  
  // Description box
  p.push();
  p.fill(20, 10, 5, 200);
  p.stroke(180, 140, 60);
  p.strokeWeight(2);
  p.rect(50, 120, CANVAS_WIDTH - 100, 180, 10);
  
  p.fill(220, 200, 160);
  p.noStroke();
  p.textSize(13);
  p.textAlign(p.CENTER, p.TOP);
  const desc = "Rise from concubine to Empress in ancient China.\nNavigate 16 chapters of deadly choices.\n\nBalance Charm, Wisdom, and Courage.\nOne wrong decision means instant death.\n\nCollect items, discover secrets, make history.";
  p.text(desc, CANVAS_WIDTH / 2, 135, CANVAS_WIDTH - 120);
  p.pop();
  
  // Controls
  p.push();
  p.fill(220, 200, 160);
  p.textSize(12);
  p.textAlign(p.CENTER);
  const controls = [
    "ARROW KEYS: Navigate choices",
    "SPACE: Confirm selection",
    "Z: View stats/inventory",
    "ESC: Pause | R: Restart"
  ];
  
  let yPos = 320;
  controls.forEach(ctrl => {
    p.text(ctrl, CANVAS_WIDTH / 2, yPos);
    yPos += 16;
  });
  p.pop();
  
  // Press ENTER prompt with pulse effect
  p.push();
  const pulse = p.sin(gameState.animationFrame * 0.1) * 0.3 + 0.7;
  p.fill(220, 180, 60, 255 * pulse);
  p.textSize(16);
  p.textAlign(p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 385);
  p.pop();
}

export function drawPlayingScreen(p) {
  const chapter = getChapterData(gameState.currentChapter);
  const scene = getSceneData(gameState.currentChapter, gameState.currentScene);
  
  // Background
  drawAnimatedBackground(p, scene.background);
  
  // Chapter title bar
  p.push();
  p.fill(40, 20, 10, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  p.fill(220, 180, 80);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Chapter ${chapter.chapter}: ${chapter.title}`, 15, 17);
  p.pop();
  
  // Stats display (top right)
  drawStatsDisplay(p, 420, 8, false);
  
  // Story text box
  p.push();
  p.fill(20, 10, 5, 230);
  p.stroke(180, 140, 60);
  p.strokeWeight(2);
  p.rect(30, 50, CANVAS_WIDTH - 60, 110, 8);
  
  p.fill(220, 200, 160);
  p.noStroke();
  p.textSize(13);
  p.textAlign(p.CENTER, p.TOP);
  p.text(scene.text, CANVAS_WIDTH / 2, 60, CANVAS_WIDTH - 80);
  p.pop();
  
  // Choices
  drawChoices(p, scene);
  
  // Particle effects
  drawParticleEffects(p);
  
  // Stats overlay (if showing)
  if (gameState.showingStats) {
    drawStatsOverlay(p);
  }
}

export function drawPausedScreen(p) {
  // Draw game state with overlay
  drawPlayingScreen(p);
  
  // Overlay
  p.push();
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.pop();
  
  // Pause indicator
  p.push();
  p.fill(220, 200, 160);
  p.stroke(180, 140, 60);
  p.strokeWeight(2);
  p.textSize(10);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
  
  // Center message
  p.push();
  p.fill(220, 180, 80);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(14);
  p.fill(200, 160, 60);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.pop();
}

export function drawGameOverScreen(p) {
  // Background
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  drawAnimatedBackground(p, isWin ? 'throne' : 'death');
  
  // Overlay
  p.push();
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.pop();
  
  // Result
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    // Victory
    p.fill(255, 215, 0);
    p.strokeWeight(3);
    p.stroke(139, 69, 19);
    p.textSize(36);
    p.text("EMPRESS ASCENDANT", CANVAS_WIDTH / 2, 80);
    
    p.noStroke();
    p.fill(220, 200, 160);
    p.textSize(14);
    p.text("You have conquered all challenges", CANVAS_WIDTH / 2, 130);
    p.text("and ascended to the Dragon Throne.", CANVAS_WIDTH / 2, 150);
    
    // Final stats
    p.textSize(16);
    p.fill(220, 180, 80);
    p.text(`Charm: ${gameState.player.charm}`, CANVAS_WIDTH / 2 - 80, 200);
    p.text(`Wisdom: ${gameState.player.wisdom}`, CANVAS_WIDTH / 2, 200);
    p.text(`Courage: ${gameState.player.courage}`, CANVAS_WIDTH / 2 + 80, 200);
    
    // Score
    p.textSize(20);
    p.fill(255, 215, 0);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
    
    // Collections
    p.textSize(12);
    p.fill(200, 160, 120);
    p.text(`Items Collected: ${gameState.inventory.length}`, CANVAS_WIDTH / 2, 270);
    p.text(`Hidden Stories: ${gameState.hiddenStoriesFound.length}`, CANVAS_WIDTH / 2, 290);
    
  } else {
    // Defeat
    p.fill(180, 40, 40);
    p.strokeWeight(2);
    p.stroke(80, 20, 20);
    p.textSize(36);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 80);
    
    p.noStroke();
    p.fill(200, 160, 140);
    p.textSize(14);
    
    // Death message
    const chapter = getChapterData(gameState.currentChapter);
    const scene = getSceneData(gameState.currentChapter, gameState.currentScene);
    const lastChoice = gameState.choicesMade[gameState.choicesMade.length - 1];
    
    if (lastChoice && lastChoice.deathMessage) {
      const lines = wrapText(p, lastChoice.deathMessage, CANVAS_WIDTH - 100);
      let y = 130;
      lines.forEach(line => {
        p.text(line, CANVAS_WIDTH / 2, y);
        y += 20;
      });
    }
    
    // Stats at death
    p.textSize(14);
    p.fill(180, 140, 100);
    p.text(`Chapter ${gameState.currentChapter} - Deaths: ${gameState.deathCount}`, CANVAS_WIDTH / 2, 220);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  }
  
  // Restart prompt
  const pulse = p.sin(gameState.animationFrame * 0.08) * 0.3 + 0.7;
  p.fill(220, 180, 60, 255 * pulse);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  p.pop();
}

function drawAnimatedBackground(p, type) {
  // Base gradient
  switch(type) {
    case 'palace':
      p.background(40, 20, 25);
      drawPalaceBackground(p);
      break;
    case 'garden':
      p.background(25, 35, 25);
      drawGardenBackground(p);
      break;
    case 'hall':
      p.background(35, 25, 20);
      drawHallBackground(p);
      break;
    case 'throne':
      p.background(50, 30, 10);
      drawThroneBackground(p);
      break;
    case 'chamber':
      p.background(30, 20, 30);
      drawChamberBackground(p);
      break;
    case 'festival':
      p.background(20, 20, 40);
      drawFestivalBackground(p);
      break;
    case 'archive':
      p.background(20, 20, 20);
      drawArchiveBackground(p);
      break;
    case 'city':
      p.background(35, 30, 25);
      drawCityBackground(p);
      break;
    case 'death':
      p.background(20, 10, 10);
      break;
    default:
      p.background(30, 25, 25);
  }
}

function drawPalaceBackground(p) {
  // Columns
  p.fill(80, 40, 40, 150);
  p.noStroke();
  for (let x = 50; x < CANVAS_WIDTH; x += 100) {
    p.rect(x, 0, 20, CANVAS_HEIGHT);
  }
  
  // Decorative patterns
  p.fill(120, 80, 60, 80);
  for (let y = 20; y < CANVAS_HEIGHT; y += 40) {
    for (let x = 20; x < CANVAS_WIDTH; x += 40) {
      p.circle(x, y, 5);
    }
  }
}

function drawGardenBackground(p) {
  // Trees
  p.fill(40, 60, 40, 120);
  for (let i = 0; i < 5; i++) {
    const x = 80 + i * 120;
    p.triangle(x, 100, x - 30, 200, x + 30, 200);
  }
  
  // Moon
  p.fill(200, 200, 180, 150);
  p.circle(500, 60, 40);
}

function drawHallBackground(p) {
  // Floor tiles
  p.stroke(60, 45, 35);
  p.strokeWeight(1);
  for (let y = CANVAS_HEIGHT - 100; y < CANVAS_HEIGHT; y += 20) {
    for (let x = 0; x < CANVAS_WIDTH; x += 20) {
      p.fill(50, 40, 30, 100);
      p.rect(x, y, 20, 20);
    }
  }
}

function drawThroneBackground(p) {
  // Throne silhouette
  p.fill(80, 60, 30, 180);
  p.noStroke();
  p.rect(CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT - 120, 120, 80);
  p.rect(CANVAS_WIDTH / 2 - 40, CANVAS_HEIGHT - 140, 80, 20);
  
  // Dragon motifs
  p.fill(120, 90, 40, 100);
  p.circle(150, 100, 50);
  p.circle(450, 100, 50);
}

function drawChamberBackground(p) {
  // Curtains
  p.fill(60, 30, 60, 150);
  for (let x = 0; x < CANVAS_WIDTH; x += 80) {
    p.rect(x, 0, 40, CANVAS_HEIGHT);
  }
}

function drawFestivalBackground(p) {
  // Lanterns
  const time = gameState.animationFrame * 0.05;
  p.fill(200, 100, 50, 200);
  p.noStroke();
  for (let i = 0; i < 6; i++) {
    const x = 80 + i * 90;
    const y = 40 + p.sin(time + i) * 10;
    p.ellipse(x, y, 25, 35);
    p.stroke(150, 80, 40);
    p.strokeWeight(1);
    p.line(x, y - 20, x, 0);
    p.noStroke();
  }
}

function drawArchiveBackground(p) {
  // Bookshelves
  p.fill(40, 30, 25, 180);
  p.rect(20, 60, 100, 200);
  p.rect(480, 60, 100, 200);
  
  // Books
  p.fill(80, 60, 50);
  for (let y = 70; y < 250; y += 15) {
    for (let x = 25; x < 115; x += 12) {
      p.rect(x, y, 10, 12);
    }
  }
}

function drawCityBackground(p) {
  // Buildings
  p.fill(50, 45, 40, 150);
  p.rect(0, CANVAS_HEIGHT - 150, 150, 150);
  p.rect(180, CANVAS_HEIGHT - 120, 100, 120);
  p.rect(320, CANVAS_HEIGHT - 140, 130, 140);
  p.rect(480, CANVAS_HEIGHT - 100, 120, 100);
}

function drawChoices(p, scene) {
  const choices = scene.choices;
  const startY = 180;
  const boxHeight = 45;
  const spacing = 10;
  
  choices.forEach((choice, index) => {
    const y = startY + index * (boxHeight + spacing);
    const isSelected = index === gameState.selectedOption;
    
    // Choice box
    p.push();
    if (isSelected) {
      p.fill(80, 60, 30, 240);
      p.stroke(220, 180, 80);
      p.strokeWeight(3);
    } else {
      p.fill(40, 30, 20, 220);
      p.stroke(120, 90, 50);
      p.strokeWeight(2);
    }
    p.rect(40, y, CANVAS_WIDTH - 80, boxHeight, 5);
    
    // Choice text
    p.noStroke();
    p.fill(isSelected ? 255 : 220, 200, 160);
    p.textSize(12);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(choice.text, 55, y + boxHeight / 2, CANVAS_WIDTH - 110);
    
    // Requirements indicator
    if (choice.requiresCharm || choice.requiresWisdom || choice.requiresCourage) {
      let reqText = "";
      let hasReq = true;
      if (choice.requiresCharm && gameState.player.charm < choice.requiresCharm) {
        reqText += `C:${choice.requiresCharm} `;
        hasReq = false;
      }
      if (choice.requiresWisdom && gameState.player.wisdom < choice.requiresWisdom) {
        reqText += `W:${choice.requiresWisdom} `;
        hasReq = false;
      }
      if (choice.requiresCourage && gameState.player.courage < choice.requiresCourage) {
        reqText += `Co:${choice.requiresCourage}`;
        hasReq = false;
      }
      
      if (!hasReq) {
        p.fill(180, 60, 60);
        p.textSize(10);
        p.textAlign(p.RIGHT, p.CENTER);
        p.text(reqText, CANVAS_WIDTH - 55, y + boxHeight / 2);
      }
    }
    
    p.pop();
  });
  
  // Instructions
  p.push();
  p.fill(180, 160, 140);
  p.textSize(11);
  p.textAlign(p.CENTER);
  p.text("↑↓: Navigate  |  SPACE: Select  |  Z: View Stats", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  p.pop();
}

function drawStatsDisplay(p, x, y, detailed) {
  p.push();
  
  if (detailed) {
    // Full stats panel
    p.fill(20, 15, 10, 240);
    p.stroke(180, 140, 60);
    p.strokeWeight(2);
    p.rect(x - 5, y - 5, 170, 100, 5);
  }
  
  // Stats
  p.noStroke();
  p.textSize(11);
  p.textAlign(p.LEFT);
  
  // Charm
  p.fill(255, 100, 150);
  p.text(`Charm: ${Math.floor(gameState.player.charm)}`, x, y);
  
  // Wisdom
  p.fill(100, 150, 255);
  p.text(`Wisdom: ${Math.floor(gameState.player.wisdom)}`, x, y + 15);
  
  // Courage
  p.fill(255, 180, 50);
  p.text(`Courage: ${Math.floor(gameState.player.courage)}`, x, y + 30);
  
  if (detailed) {
    // Score
    p.fill(220, 200, 160);
    p.text(`Score: ${gameState.score}`, x, y + 50);
    
    // Chapter
    p.text(`Chapter: ${gameState.currentChapter}/16`, x, y + 65);
    
    // Items
    p.text(`Items: ${gameState.inventory.length}`, x, y + 80);
  }
  
  p.pop();
}

function drawStatsOverlay(p) {
  // Overlay background
  p.push();
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.pop();
  
  // Stats panel
  p.push();
  p.fill(30, 20, 15, 250);
  p.stroke(220, 180, 80);
  p.strokeWeight(3);
  p.rect(100, 50, CANVAS_WIDTH - 200, CANVAS_HEIGHT - 100, 10);
  
  // Title
  p.fill(220, 180, 80);
  p.noStroke();
  p.textSize(20);
  p.textAlign(p.CENTER);
  p.text("Character Stats", CANVAS_WIDTH / 2, 80);
  
  // Stats with bars
  const statY = 120;
  drawStatBar(p, "Charm", gameState.player.charm, 255, 100, 150, 150, statY);
  drawStatBar(p, "Wisdom", gameState.player.wisdom, 100, 150, 255, 150, statY + 40);
  drawStatBar(p, "Courage", gameState.player.courage, 255, 180, 50, 150, statY + 80);
  
  // Inventory
  p.fill(220, 200, 160);
  p.textSize(16);
  p.textAlign(p.LEFT);
  p.text("Inventory:", 150, statY + 140);
  
  p.textSize(12);
  if (gameState.inventory.length === 0) {
    p.fill(160, 140, 120);
    p.text("No items collected yet", 150, statY + 165);
  } else {
    let itemY = statY + 165;
    gameState.inventory.forEach(item => {
      p.fill(220, 200, 160);
      p.text(`• ${item}`, 150, itemY);
      itemY += 18;
    });
  }
  
  // Hidden stories
  if (gameState.hiddenStoriesFound.length > 0) {
    p.fill(220, 180, 100);
    p.textSize(12);
    p.text(`Hidden Stories Found: ${gameState.hiddenStoriesFound.length}`, 150, CANVAS_HEIGHT - 120);
  }
  
  // Close instruction
  p.fill(180, 160, 140);
  p.textSize(11);
  p.textAlign(p.CENTER);
  p.text("Press Z to close", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 70);
  
  p.pop();
}

function drawStatBar(p, label, value, r, g, b, x, y) {
  const maxWidth = 280;
  const barWidth = (value / 150) * maxWidth; // Max stat is 150
  
  p.push();
  p.fill(220, 200, 160);
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text(label, x, y);
  
  // Bar background
  p.fill(60, 50, 40);
  p.noStroke();
  p.rect(x, y + 5, maxWidth, 20, 5);
  
  // Bar fill
  p.fill(r, g, b);
  p.rect(x, y + 5, Math.min(barWidth, maxWidth), 20, 5);
  
  // Value text
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.CENTER);
  p.text(Math.floor(value), x + maxWidth / 2, y + 18);
  
  p.pop();
}

function drawParticleEffects(p) {
  gameState.particleEffects = gameState.particleEffects.filter(particle => {
    particle.life--;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.1; // Gravity
    
    if (particle.life > 0) {
      p.push();
      p.fill(particle.r, particle.g, particle.b, particle.life * 2);
      p.noStroke();
      p.circle(particle.x, particle.y, particle.size);
      p.pop();
      return true;
    }
    return false;
  });
}

export function createParticleEffect(x, y, color) {
  for (let i = 0; i < 15; i++) {
    gameState.particleEffects.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2,
      life: 100,
      size: Math.random() * 5 + 2,
      r: color[0],
      g: color[1],
      b: color[2]
    });
  }
}

function wrapText(p, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = p.textWidth(testLine);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}