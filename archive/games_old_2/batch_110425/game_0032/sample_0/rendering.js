// rendering.js - All rendering functions
import { gameState, GAME_PHASES, PLAY_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, GENRES, THEMES, SET_PIECES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 25, 40);
  
  // Title
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("TVスタジオ物語", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 220, 255);
  p.textSize(16);
  p.text("TV Studio Story", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const descLines = [
    "Manage your TV studio and create hit programs!",
    "Select genres, themes, cast talent, and design sets.",
    "Earn ratings and fans to unlock new content.",
    "",
    "GOAL: Reach 1000 fans to win!"
  ];
  let yPos = 160;
  descLines.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  });
  
  // Controls
  p.fill(180, 200, 255);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  const controls = [
    "Arrow Keys: Navigate menus",
    "Space: Confirm selection",
    "Z: Cancel / Go back",
    "Shift: Switch planning phase",
    "ESC: Pause game"
  ];
  yPos = 280;
  controls.forEach(ctrl => {
    p.text(ctrl, 100, yPos);
    yPos += 18;
  });
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
  }
}

export function renderGameOver(p, won) {
  p.background(won ? [20, 40, 20] : [40, 20, 20]);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.fill(won ? [100, 255, 100] : [255, 100, 100]);
  p.textSize(48);
  p.text(won ? "SUCCESS!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(255);
  p.textSize(20);
  p.text(`Final Fans: ${gameState.fans}`, CANVAS_WIDTH / 2, 160);
  p.text(`Programs Produced: ${gameState.programsProduced}`, CANVAS_WIDTH / 2, 190);
  p.text(`Station Rank: ${gameState.stationRank}`, CANVAS_WIDTH / 2, 220);
  p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 250);
  
  if (won) {
    p.fill(200, 255, 200);
    p.textSize(16);
    p.text("Your studio is a huge success!", CANVAS_WIDTH / 2, 290);
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}

export function renderPlaying(p) {
  p.background(30, 35, 50);
  
  // Top bar with stats
  renderStatsBar(p);
  
  // Render based on play phase
  switch (gameState.playPhase) {
    case PLAY_PHASES.SELECT_GENRE:
      renderGenreSelection(p);
      break;
    case PLAY_PHASES.SELECT_THEME:
      renderThemeSelection(p);
      break;
    case PLAY_PHASES.SELECT_TALENT:
      renderTalentSelection(p);
      break;
    case PLAY_PHASES.DESIGN_STUDIO:
      renderStudioDesign(p);
      break;
    case PLAY_PHASES.PRODUCING:
      renderProduction(p);
      break;
    case PLAY_PHASES.RESULTS:
      renderResults(p);
      break;
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 100);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function renderStatsBar(p) {
  p.fill(40, 45, 60);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  p.fill(255, 220, 100);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Fans: ${gameState.fans}/1000`, 10, 10);
  p.text(`Research: ${gameState.researchPoints}`, 130, 10);
  p.text(`SNS Buzz: ${gameState.snsBuzz}`, 250, 10);
  p.text(`Rank: ${gameState.stationRank}`, 380, 10);
  p.text(`Programs: ${gameState.programsProduced}`, 460, 10);
}

function renderGenreSelection(p) {
  p.fill(255);
  p.textSize(20);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Select Genre", CANVAS_WIDTH / 2, 50);
  
  const unlockedGenres = GENRES.filter(g => g.unlocked);
  const startY = 100;
  const spacing = 45;
  
  unlockedGenres.forEach((genre, index) => {
    const y = startY + index * spacing;
    const isSelected = index === gameState.selectedGenreIndex;
    
    // Background
    p.fill(isSelected ? [80, 100, 140] : [50, 55, 70]);
    p.noStroke();
    p.rect(150, y - 5, 300, 35, 5);
    
    // Text
    p.fill(isSelected ? [255, 255, 100] : [220, 220, 220]);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(genre.name, 170, y + 5);
  });
  
  // Instructions
  p.fill(180, 180, 180);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Arrow Keys: Navigate | Space: Select | Shift: Next Phase", CANVAS_WIDTH / 2, 360);
}

function renderThemeSelection(p) {
  p.fill(255);
  p.textSize(20);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Select Theme", CANVAS_WIDTH / 2, 50);
  
  // Show selected genre
  if (gameState.currentProgram.genre) {
    p.fill(255, 220, 100);
    p.textSize(14);
    p.text(`Genre: ${GENRES.find(g => g.id === gameState.currentProgram.genre).name}`, CANVAS_WIDTH / 2, 75);
  }
  
  const unlockedThemes = THEMES.filter(t => t.unlocked);
  const startY = 110;
  const spacing = 45;
  
  unlockedThemes.forEach((theme, index) => {
    const y = startY + index * spacing;
    const isSelected = index === gameState.selectedThemeIndex;
    
    // Background
    p.fill(isSelected ? [80, 100, 140] : [50, 55, 70]);
    p.noStroke();
    p.rect(150, y - 5, 300, 35, 5);
    
    // Text
    p.fill(isSelected ? [255, 255, 100] : [220, 220, 220]);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(theme.name, 170, y + 5);
  });
  
  // Instructions
  p.fill(180, 180, 180);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Arrow Keys: Navigate | Space: Select | Z: Back", CANVAS_WIDTH / 2, 360);
}

function renderTalentSelection(p) {
  p.fill(255);
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Cast Talent", CANVAS_WIDTH / 2, 50);
  
  // Show program info
  p.fill(255, 220, 100);
  p.textSize(12);
  const genre = GENRES.find(g => g.id === gameState.currentProgram.genre);
  const theme = THEMES.find(t => t.id === gameState.currentProgram.theme);
  p.text(`${genre?.name || "?"} / ${theme?.name || "?"}`, CANVAS_WIDTH / 2, 72);
  
  // Show current cast
  p.fill(200, 255, 200);
  p.textSize(11);
  const hostText = gameState.currentProgram.host ? `Host: ${gameState.currentProgram.host.name}` : "Host: (none)";
  p.text(hostText, 100, 92);
  
  const guestText = `Guests: ${gameState.currentProgram.guests.length}`;
  p.text(guestText, 280, 92);
  
  // Talent list
  const availableTalent = gameState.availableTalent.filter(t => !t.hired);
  const startY = 120;
  const spacing = 32;
  const maxDisplay = 7;
  
  for (let i = 0; i < Math.min(availableTalent.length, maxDisplay); i++) {
    const talent = availableTalent[i];
    const y = startY + i * spacing;
    const isSelected = i === gameState.selectedTalentIndex;
    
    // Background
    p.fill(isSelected ? [80, 100, 140] : [50, 55, 70]);
    p.noStroke();
    p.rect(50, y - 3, 500, 28, 3);
    
    // Name
    p.fill(isSelected ? [255, 255, 100] : [220, 220, 220]);
    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.text(talent.name, 60, y + 3);
    
    // Skills
    p.fill(isSelected ? [200, 220, 255] : [150, 150, 150]);
    p.textSize(11);
    p.text(`T:${talent.talkSkill} P:${talent.performSkill} A:${talent.appealSkill}`, 250, y + 5);
    
    // Tier
    p.fill(talent.tier >= 2 ? [255, 200, 100] : [150, 150, 150]);
    p.text(`Tier ${talent.tier}`, 450, y + 5);
  }
  
  // Instructions
  p.fill(180, 180, 180);
  p.textSize(11);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Space: Hire Host/Guest | Z: Remove | Shift: Next Phase", CANVAS_WIDTH / 2, 365);
}

function renderStudioDesign(p) {
  p.fill(255);
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Design Studio", CANVAS_WIDTH / 2, 50);
  
  // Show program info
  p.fill(255, 220, 100);
  p.textSize(11);
  const genre = GENRES.find(g => g.id === gameState.currentProgram.genre);
  const theme = THEMES.find(t => t.id === gameState.currentProgram.theme);
  p.text(`${genre?.name || "?"} / ${theme?.name || "?"}`, CANVAS_WIDTH / 2, 70);
  
  // Studio grid (8x6)
  const gridStartX = 80;
  const gridStartY = 100;
  const cellSize = 40;
  
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 8; x++) {
      const px = gridStartX + x * cellSize;
      const py = gridStartY + y * cellSize;
      
      const isCursor = (x === gameState.cursorX && y === gameState.cursorY);
      const hasPiece = gameState.studioGrid[y][x] !== null;
      
      // Cell background
      p.fill(isCursor ? [100, 120, 160] : [60, 65, 80]);
      p.stroke(hasPiece ? [255, 200, 100] : [80, 85, 100]);
      p.strokeWeight(isCursor ? 2 : 1);
      p.rect(px, py, cellSize - 2, cellSize - 2, 3);
      
      // Draw set piece if present
      if (hasPiece) {
        const pieceId = gameState.studioGrid[y][x];
        drawSetPieceIcon(p, pieceId, px + cellSize / 2, py + cellSize / 2, cellSize * 0.6);
      }
    }
  }
  
  // Set piece selector
  const selectorY = 340;
  p.fill(200, 200, 200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Available Sets:", 80, selectorY - 20);
  
  const unlockedPieces = SET_PIECES.filter(s => s.unlocked);
  unlockedPieces.forEach((piece, index) => {
    const px = 80 + index * 80;
    const isSelected = index === gameState.selectedSetPieceIndex;
    
    p.fill(isSelected ? [100, 120, 160] : [70, 75, 90]);
    p.stroke(isSelected ? [255, 255, 100] : [90, 95, 110]);
    p.strokeWeight(isSelected ? 2 : 1);
    p.rect(px, selectorY, 70, 45, 3);
    
    // Icon
    drawSetPieceIcon(p, piece.id, px + 35, selectorY + 15, 25);
    
    // Name
    p.fill(isSelected ? [255, 255, 100] : [200, 200, 200]);
    p.noStroke();
    p.textSize(9);
    p.textAlign(p.CENTER, p.TOP);
    p.text(piece.name, px + 35, selectorY + 32);
  });
  
  // Instructions
  p.fill(180, 180, 180);
  p.textSize(10);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("Arrows: Move | Space: Place/Remove | Shift: Start Production", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 5);
}

function drawSetPieceIcon(p, pieceId, x, y, size) {
  p.push();
  p.translate(x, y);
  
  switch (pieceId) {
    case "desk":
      p.fill(139, 90, 60);
      p.noStroke();
      p.rect(-size/2, -size/3, size, size/2, 2);
      break;
    case "sofa":
      p.fill(100, 80, 120);
      p.noStroke();
      p.rect(-size/2, -size/4, size, size/2, 3);
      p.rect(-size/2, -size/4, size/6, size/3);
      p.rect(size/2 - size/6, -size/4, size/6, size/3);
      break;
    case "plant":
      p.fill(60, 150, 60);
      p.noStroke();
      p.ellipse(0, -size/4, size/2, size/2);
      p.fill(100, 70, 50);
      p.rect(-size/10, size/8, size/5, size/3);
      break;
    case "screen":
      p.fill(40, 40, 60);
      p.stroke(180, 180, 200);
      p.strokeWeight(2);
      p.rect(-size/2, -size/3, size, size * 0.6, 2);
      break;
    case "lights":
      p.fill(255, 255, 150);
      p.noStroke();
      for (let i = 0; i < 3; i++) {
        p.ellipse(-size/3 + i * size/3, 0, size/4, size/4);
      }
      break;
    case "camera":
      p.fill(60, 60, 80);
      p.noStroke();
      p.rect(-size/3, -size/4, size * 0.6, size/2, 2);
      p.fill(100, 100, 120);
      p.ellipse(0, 0, size/3, size/3);
      break;
  }
  
  p.pop();
}

function renderProduction(p) {
  p.background(20, 25, 40);
  
  p.fill(255, 200, 100);
  p.textSize(28);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRODUCING...", CANVAS_WIDTH / 2, 150);
  
  // Progress bar
  const progress = gameState.productionTimer / gameState.productionDuration;
  const barWidth = 400;
  const barHeight = 30;
  const barX = (CANVAS_WIDTH - barWidth) / 2;
  const barY = 200;
  
  p.fill(60, 65, 80);
  p.noStroke();
  p.rect(barX, barY, barWidth, barHeight, 5);
  
  p.fill(100, 200, 100);
  p.rect(barX, barY, barWidth * progress, barHeight, 5);
  
  // Percentage
  p.fill(255);
  p.textSize(16);
  p.text(`${Math.floor(progress * 100)}%`, CANVAS_WIDTH / 2, barY + barHeight + 30);
  
  // Animation
  const dots = ".".repeat((Math.floor(p.frameCount / 20) % 3) + 1);
  p.textSize(20);
  p.text(dots, CANVAS_WIDTH / 2, 280);
}

function renderResults(p) {
  p.background(25, 30, 45);
  
  const program = gameState.currentProgram;
  const genre = GENRES.find(g => g.id === program.genre);
  const theme = THEMES.find(t => t.id === program.theme);
  
  p.fill(255, 220, 100);
  p.textSize(24);
  p.textAlign(p.CENTER, p.TOP);
  p.text("PROGRAM RESULTS", CANVAS_WIDTH / 2, 60);
  
  // Program info
  p.fill(200, 220, 255);
  p.textSize(16);
  p.text(`${genre?.name || "?"} / ${theme?.name || "?"}`, CANVAS_WIDTH / 2, 95);
  
  // Ratings display
  const boxY = 130;
  const boxHeight = 140;
  
  p.fill(50, 55, 70);
  p.noStroke();
  p.rect(100, boxY, 400, boxHeight, 8);
  
  // Quality
  p.fill(255, 200, 150);
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Quality: ${program.quality}`, 120, boxY + 20);
  
  // Rating
  p.fill(150, 255, 150);
  p.text(`Rating: ${program.rating}%`, 120, boxY + 50);
  
  // Rewards (calculate on the fly for display)
  const fans = Math.floor(program.rating / 5) + Math.floor(program.quality / 10);
  const research = Math.floor(program.quality / 4);
  
  p.fill(255, 255, 150);
  p.textSize(14);
  p.text(`+${fans} Fans`, 120, boxY + 85);
  p.text(`+${research} Research`, 120, boxY + 105);
  
  // Continue prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  p.textAlign(p.CENTER, p.BOTTOM);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("Press SPACE to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
}