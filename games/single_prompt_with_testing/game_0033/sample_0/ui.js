// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, LANGUAGES } from './globals.js';

export function drawUI(p) {
  p.push();

  if (gameState.gamePhase === GAME_PHASES.START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    drawPlayingUI(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    drawPlayingUI(p);
    drawPausedOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    drawGameOverScreen(p);
  }

  p.pop();
}

function drawStartScreen(p) {
  // Background
  p.background(20, 15, 40);

  // Tower silhouette
  p.fill(40, 30, 60, 150);
  p.noStroke();
  p.beginShape();
  p.vertex(300, 400);
  p.vertex(250, 0);
  p.vertex(350, 0);
  p.endShape(p.CLOSE);

  // Decorative glyphs floating
  p.fill(100, 150, 255, 100);
  p.textSize(30);
  p.textAlign(p.CENTER, p.CENTER);
  for (let i = 0; i < LANGUAGES.length; i++) {
    const lang = LANGUAGES[i];
    lang.glyphs.forEach((glyph, j) => {
      const x = 100 + (i * 200) + p.sin((p.frameCount * 0.02) + j) * 20;
      const y = 100 + j * 80 + p.cos((p.frameCount * 0.02) + j) * 15;
      p.fill(...lang.color, 80);
      p.text(glyph.symbol, x, y);
    });
  }

  // Title
  p.fill(255, 255, 240);
  p.textSize(36);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("TOWER OF BABEL", CANVAS_WIDTH / 2, 80);

  // Subtitle
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text("A Language Deciphering Adventure", CANVAS_WIDTH / 2, 115);

  // Description box
  p.fill(40, 35, 60, 200);
  p.stroke(100, 150, 255);
  p.strokeWeight(2);
  p.rect(50, 150, 500, 140, 5);

  p.fill(220, 220, 240);
  p.noStroke();
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  const description = [
    "You are the Traveler, exploring a mystical tower where three",
    "ancient Peoples speak different languages. Collect glyphs by",
    "talking to NPCs and finding artifacts. Use context clues to",
    "decipher their meanings in your notebook. Translate all glyphs",
    "from each culture to unite the Peoples and reach the tower's top!"
  ];
  description.forEach((line, i) => {
    p.text(line, 70, 160 + i * 18);
  });

  // Instructions box
  p.fill(40, 35, 60, 200);
  p.stroke(255, 150, 100);
  p.strokeWeight(2);
  p.rect(50, 305, 500, 65, 5);

  p.fill(220, 220, 240);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Arrow Keys: Move   |   Space: Interact   |   Z: Open Notebook   |   Shift: Sprint", 70, 318);
  p.text("ESC: Pause   |   R: Restart", 70, 338);

  // Start prompt (blinking)
  if (p.frameCount % 60 < 40) {
    p.fill(150, 255, 150);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 385);
  }
}

function drawPlayingUI(p) {
  // Score
  p.fill(255, 255, 240);
  p.stroke(0, 0, 0);
  p.strokeWeight(3);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Score: ${gameState.score}`, 10, 10);

  // Progress bar
  const totalGlyphs = LANGUAGES.reduce((sum, lang) => sum + lang.glyphs.length, 0);
  const progress = gameState.translatedGlyphs.length / totalGlyphs;
  
  p.noStroke();
  p.fill(50, 50, 50, 150);
  p.rect(10, 35, 200, 20, 3);
  p.fill(100, 200, 100);
  p.rect(10, 35, 200 * progress, 20, 3);
  
  p.fill(255);
  p.noStroke();
  p.textSize(11);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${gameState.translatedGlyphs.length}/${totalGlyphs} Glyphs Translated`, 110, 45);

  // Peoples united
  p.fill(255, 255, 240);
  p.stroke(0, 0, 0);
  p.strokeWeight(3);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Peoples United: ${gameState.peopleUnited}/${gameState.totalPeoples}`, 10, 65);

  // Current floor indicator
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Floor ${gameState.currentFloor + 1}`, CANVAS_WIDTH - 10, 10);
  const floorName = LANGUAGES[gameState.currentFloor].name;
  p.textSize(12);
  p.text(floorName, CANVAS_WIDTH - 10, 30);

  // Interaction prompt
  if (gameState.interactionPrompt) {
    p.fill(40, 40, 60, 230);
    p.noStroke();
    p.rect(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT - 50, 400, 40, 5);
    
    p.fill(255, 255, 150);
    p.textSize(13);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(gameState.interactionPrompt, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }

  // Collected glyphs indicator
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(255, 255, 240);
  p.stroke(0, 0, 0);
  p.strokeWeight(3);
  p.text("Collected:", 10, 90);
  
  const maxShow = 8;
  gameState.collectedGlyphs.slice(0, maxShow).forEach((glyph, i) => {
    const isTranslated = gameState.translatedGlyphs.some(g => g.symbol === glyph.symbol);
    const lang = LANGUAGES[glyph.languageIndex];
    p.fill(...(isTranslated ? [150, 255, 150] : lang.color));
    p.noStroke();
    p.textSize(16);
    p.text(glyph.symbol, 85 + i * 20, 90);
  });

  if (gameState.collectedGlyphs.length > maxShow) {
    p.fill(200, 200, 200);
    p.textSize(12);
    p.text(`+${gameState.collectedGlyphs.length - maxShow}`, 85 + maxShow * 20, 90);
  }
}

function drawPausedOverlay(p) {
  p.fill(0, 0, 0, 100);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  p.fill(255, 255, 240);
  p.textSize(20);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function drawGameOverScreen(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;

  // Result box
  p.fill(40, 35, 60, 250);
  p.stroke(...(isWin ? [150, 255, 150] : [255, 150, 150]));
  p.strokeWeight(3);
  p.rect(100, 80, 400, 240, 10);

  // Title
  p.fill(...(isWin ? [150, 255, 150] : [255, 150, 150]));
  p.noStroke();
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 120);

  // Message
  p.fill(220, 220, 240);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  
  if (isWin) {
    const messages = [
      "The Peoples of the Tower are united!",
      "Through understanding their languages,",
      "you have restored harmony to the Tower.",
      "",
      `Final Score: ${gameState.score}`,
      `Glyphs Translated: ${gameState.translatedGlyphs.length}/${LANGUAGES.reduce((s, l) => s + l.glyphs.length, 0)}`
    ];
    messages.forEach((msg, i) => {
      p.text(msg, CANVAS_WIDTH / 2, 160 + i * 20);
    });
  } else {
    p.text("Better luck next time!", CANVAS_WIDTH / 2, 170);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  }

  // Restart prompt
  if (p.frameCount % 60 < 40) {
    p.fill(255, 255, 150);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 290);
  }
}