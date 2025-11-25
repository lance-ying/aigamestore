// rendering.js - Game rendering

import { gameState, GAME_PHASES, PLAY_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

const HEX_SIZE = 35;

export function drawStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("SMALL WORLD", CANVAS_WIDTH / 2, 80);
  
  p.textSize(18);
  p.fill(200, 200, 255);
  p.text("Conquer Territories & Rule the Realm", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textSize(14);
  p.fill(220, 220, 220);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "• Conquer territories over 8 rounds",
    "• Score victory points each round",
    "• Highest score wins!",
    "",
    "HOW TO PLAY:",
    "• Select race-ability combination",
    "• Deploy tokens to conquer territories",
    "• Empty lands cost 2 tokens",
    "• Occupied lands cost 2 + enemy tokens",
    "• Put races in decline for residual points",
    "",
    "CONTROLS:",
    "Arrow Keys: Navigate & select",
    "Space: Confirm selection / End turn",
    "Shift: Put race into decline",
    "Z: Undo last token placement"
  ];
  
  let y = 160;
  instructions.forEach(line => {
    if (line.startsWith("•")) {
      p.fill(180, 180, 180);
      p.text(line, 60, y);
    } else if (line === "") {
      // Skip
    } else {
      p.fill(255, 200, 100);
      p.text(line, 50, y);
    }
    y += 18;
  });
  
  // Press Enter
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  
  const blink = Math.floor(p.frameCount / 30) % 2;
  if (blink === 0) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
}

export function drawGameOverScreen(p) {
  p.background(20, 30, 50);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 100);
  
  // Scores
  p.textSize(24);
  p.fill(255, 255, 255);
  p.text("FINAL SCORES", CANVAS_WIDTH / 2, 160);
  
  p.textSize(20);
  gameState.players.forEach((player, i) => {
    const label = i === 0 ? "You" : `AI ${i}`;
    const y = 200 + i * 40;
    
    p.fill(i === 0 ? [100, 200, 255] : [255, 150, 150]);
    p.text(`${label}: ${player.score} points`, CANVAS_WIDTH / 2, y);
  });
  
  // Message
  p.textSize(16);
  p.fill(220, 220, 220);
  p.text(
    isWin ? "You conquered the realm!" : "Better luck next time!",
    CANVAS_WIDTH / 2,
    300
  );
  
  // Restart
  p.fill(255, 255, 100);
  p.textSize(18);
  const blink = Math.floor(p.frameCount / 30) % 2;
  if (blink === 0) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
}

export function drawPlayingScreen(p) {
  p.background(40, 50, 70);
  
  // Draw territories
  drawTerritories(p);
  
  // Draw UI
  drawUI(p);
  
  // Draw race selection if needed
  if (gameState.playPhase === PLAY_PHASES.SELECT_RACE && gameState.currentPlayer === 0) {
    drawRaceSelection(p);
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawTerritories(p) {
  gameState.territories.forEach(territory => {
    drawHexagon(p, territory);
  });
}

function drawHexagon(p, territory) {
  const hexSize = HEX_SIZE;
  
  // Determine fill color
  let fillColor = territory.terrain.color;
  
  // Highlight selected/hovered
  const isSelected = gameState.selectedTerritory === territory;
  const isHovered = gameState.hoveredTerritory === territory;
  
  p.push();
  p.translate(territory.x, territory.y);
  
  // Draw hexagon
  p.strokeWeight(2);
  p.stroke(isSelected ? [255, 255, 100] : (isHovered ? [200, 200, 255] : [80, 80, 80]));
  p.fill(...fillColor);
  
  p.beginShape();
  for (let i = 0; i < 6; i++) {
    const angle = p.TWO_PI / 6 * i + p.PI / 6;
    const x = hexSize * p.cos(angle);
    const y = hexSize * p.sin(angle);
    p.vertex(x, y);
  }
  p.endShape(p.CLOSE);
  
  // Draw owner indicator
  if (territory.owner !== null) {
    const player = gameState.players[territory.owner];
    const ownerColor = territory.owner === 0 ? [100, 150, 255] : [255, 100, 100];
    
    p.fill(...(territory.isDeclined ? [100, 100, 100] : ownerColor));
    p.noStroke();
    p.circle(0, 0, hexSize * 0.8);
    
    // Draw token count
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(territory.tokens, 0, 0);
  }
  
  // Draw bonus points indicator
  if (territory.bonusPoints > 0) {
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(`+${territory.bonusPoints}`, 0, hexSize * 0.5);
  }
  
  p.pop();
}

function drawUI(p) {
  // Top bar - round and scores
  p.fill(30, 40, 60, 230);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`Round ${gameState.currentRound}/${gameState.maxRounds}`, 10, 15);
  
  // Player scores
  const player = gameState.players[0];
  const ai = gameState.players[1];
  p.text(`You: ${player.score}`, 10, 35);
  p.text(`AI: ${ai.score}`, 150, 35);
  
  // Current player indicator
  const currentPlayerLabel = gameState.currentPlayer === 0 ? "Your Turn" : "AI Turn";
  p.fill(gameState.currentPlayer === 0 ? [100, 255, 100] : [255, 150, 150]);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(currentPlayerLabel, CANVAS_WIDTH - 10, 25);
  
  // Bottom bar - messages and info
  p.fill(30, 40, 60, 230);
  p.rect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
  
  p.fill(255, 255, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(gameState.currentMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  
  // Left sidebar - active race info
  if (gameState.currentPlayer === 0) {
    const player = gameState.players[0];
    if (player.activeRace) {
      p.fill(30, 40, 60, 200);
      p.rect(0, 60, 120, 100);
      
      p.fill(255, 255, 255);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(12);
      p.text("Active Race:", 5, 65);
      p.text(player.activeRace.ability.name, 5, 85);
      p.text(player.activeRace.race.name, 5, 100);
      p.text(`Tokens: ${player.availableTokens}`, 5, 120);
      
      if (player.declinedRace) {
        p.text("Declined:", 5, 140);
        p.fill(150, 150, 150);
        p.text(player.declinedRace.race.name, 5, 155);
      }
    }
  }
}

function drawRaceSelection(p) {
  // Draw race combo selection overlay
  const panelWidth = 400;
  const panelHeight = 300;
  const panelX = (CANVAS_WIDTH - panelWidth) / 2;
  const panelY = (CANVAS_HEIGHT - panelHeight) / 2;
  
  p.fill(20, 30, 50, 240);
  p.stroke(100, 150, 200);
  p.strokeWeight(3);
  p.rect(panelX, panelY, panelWidth, panelHeight, 10);
  
  p.fill(255, 215, 0);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  p.text("Select Race Combination", CANVAS_WIDTH / 2, panelY + 15);
  
  // Draw available combos
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  gameState.availableRaceCombos.forEach((combo, i) => {
    const y = panelY + 60 + i * 35;
    const isSelected = gameState.selectedRaceCombo === i;
    
    // Highlight selected
    if (isSelected) {
      p.fill(100, 150, 200, 100);
      p.rect(panelX + 10, y - 5, panelWidth - 20, 30, 5);
    }
    
    p.fill(255, 255, 255);
    p.text(`${i + 1}. ${combo.getDescription()}`, panelX + 20, y);
    p.textSize(11);
    p.fill(200, 200, 200);
    p.text(`${combo.race.tokens} tokens - ${combo.ability.effect}`, panelX + 30, y + 15);
    p.textSize(14);
  });
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text("Arrow Keys to select, Space to confirm", CANVAS_WIDTH / 2, panelY + panelHeight - 15);
}