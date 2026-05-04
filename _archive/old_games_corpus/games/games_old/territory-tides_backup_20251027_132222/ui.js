import { gameState, PHASE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawUI(p) {
  if (gameState.gamePhase === "START") {
    drawStartScreen(p);
  } else if (gameState.gamePhase === "PLAYING") {
    drawPlayingUI(p);
  } else if (gameState.gamePhase === "PAUSED") {
    drawPlayingUI(p);
    drawPausedOverlay(p);
  } else if (gameState.gamePhase === "GAME_OVER") {
    drawGameOverScreen(p);
  }
}

function drawStartScreen(p) {
  p.background(20, 30, 50);
  
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("TERRITORY TIDES", CANVAS_WIDTH / 2, 80);
  
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text("Conquer all territories to dominate the map!", CANVAS_WIDTH / 2, 140);
  
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.fill(180, 180, 180);
  const instructions = [
    "KEYBOARD CONTROLS:",
    "• Arrow Left/Right: Navigate territories",
    "• Enter: Select highlighted territory",
    "• Arrow Up/Down: Adjust army count",
    "• Space: Confirm action",
    "• Shift: Advance to next phase",
    "• Z: End turn early",
    "",
    "GAMEPLAY:",
    "• REINFORCE: Deploy armies to your territories",
    "• ATTACK: Conquer enemy territories",
    "• FORTIFY: Move armies between your territories",
    "",
    "Win by capturing all territories!"
  ];
  
  let yPos = 170;
  for (let line of instructions) {
    p.text(line, 80, yPos);
    yPos += 18;
  }
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  
  if (gameState.highScore > 0) {
    p.fill(150, 255, 150);
    p.textSize(18);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 20);
  }
}

function drawPlayingUI(p) {
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.fill(255);
  
  const currentPlayer = gameState.players[gameState.currentPlayerId];
  if (currentPlayer) {
    p.fill(...currentPlayer.color);
    p.text(`Player: ${currentPlayer.name}`, 10, 10);
  }
  
  p.fill(255);
  p.text(`Level: ${gameState.currentLevel}`, 10, 30);
  
  p.textAlign(p.CENTER, p.TOP);
  let phaseText = "";
  if (gameState.currentPhase === PHASE.REINFORCE) {
    phaseText = "Phase: REINFORCE";
  } else if (gameState.currentPhase === PHASE.ATTACK) {
    phaseText = "Phase: ATTACK";
  } else if (gameState.currentPhase === PHASE.FORTIFY) {
    phaseText = "Phase: FORTIFY";
  } else if (gameState.currentPhase === PHASE.AI_TURN) {
    phaseText = "Phase: AI TURN";
  }
  p.text(phaseText, CANVAS_WIDTH / 2, 10);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  if (gameState.currentPhase === PHASE.REINFORCE && gameState.reinforcementPool > 0) {
    p.textAlign(p.LEFT, p.BOTTOM);
    p.fill(255, 220, 100);
    p.text(`Reinforcements: ${gameState.reinforcementPool}`, 10, CANVAS_HEIGHT - 30);
  }
  
  const highlightedTerritory = gameState.territories[gameState.highlightedTerritoryIndex];
  if (highlightedTerritory) {
    p.textAlign(p.CENTER, p.BOTTOM);
    p.fill(200, 200, 255);
    p.textSize(12);
    p.text(`[Arrow Keys to navigate] ${highlightedTerritory.name} - Owner: ${gameState.players[highlightedTerritory.ownerId]?.name} - Armies: ${highlightedTerritory.armies}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  }
  
  if (gameState.selectedTerritoryId1 !== null) {
    const territory = gameState.territories.find(t => t.id === gameState.selectedTerritoryId1);
    if (territory) {
      p.textAlign(p.CENTER, p.BOTTOM);
      p.fill(255, 255, 100);
      p.textSize(13);
      p.text(`Selected: ${territory.name} | Armies: ${territory.armies}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    }
  }
  
  if (gameState.armiesToMove > 0) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 255, 100);
    p.textSize(18);
    let actionText = "";
    if (gameState.currentPhase === PHASE.REINFORCE) {
      actionText = `Deploying: ${gameState.armiesToMove} armies`;
    } else if (gameState.currentPhase === PHASE.ATTACK) {
      actionText = `Attacking with: ${gameState.armiesToMove} armies`;
    } else if (gameState.currentPhase === PHASE.FORTIFY) {
      actionText = `Moving: ${gameState.armiesToMove} armies`;
    }
    p.text(actionText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
    p.textSize(14);
    p.fill(200, 200, 200);
    p.text("Arrow Up/Down to adjust | Space to confirm", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 75);
  }
  
  if (gameState.currentPhase === PHASE.REINFORCE && gameState.selectedTerritoryId1 === null) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(200, 255, 200);
    p.textSize(14);
    p.text("Press Enter to select highlighted territory", CANVAS_WIDTH / 2, 60);
  } else if (gameState.currentPhase === PHASE.ATTACK && gameState.selectedTerritoryId1 === null) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 200, 200);
    p.textSize(14);
    p.text("Select your territory with armies > 1", CANVAS_WIDTH / 2, 60);
  } else if (gameState.currentPhase === PHASE.ATTACK && gameState.selectedTerritoryId1 !== null && gameState.selectedTerritoryId2 === null) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 200, 200);
    p.textSize(14);
    p.text("Select adjacent enemy territory to attack", CANVAS_WIDTH / 2, 60);
  } else if (gameState.currentPhase === PHASE.FORTIFY && gameState.selectedTerritoryId1 === null) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(200, 200, 255);
    p.textSize(14);
    p.text("Select source territory (or press Shift/Z to skip)", CANVAS_WIDTH / 2, 60);
  } else if (gameState.currentPhase === PHASE.FORTIFY && gameState.selectedTerritoryId1 !== null && gameState.selectedTerritoryId2 === null) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(200, 200, 255);
    p.textSize(14);
    p.text("Select adjacent friendly territory", CANVAS_WIDTH / 2, 60);
  }
  
  if (gameState.combatResults) {
    drawCombatResults(p);
  }
}

function drawPausedOverlay(p) {
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255, 255, 0);
  p.textSize(18);
  p.text("PAUSED", CANVAS_WIDTH - 10, 35);
}

function drawGameOverScreen(p) {
  p.background(20, 20, 30);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  const isWin = gameState.currentLevel > 3;
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 100);
    p.fill(255, 255, 100);
    p.textSize(24);
    p.text("All levels conquered!", CANVAS_WIDTH / 2, 160);
  } else {
    const playerTerritories = gameState.territories.filter(t => t.ownerId === 0);
    if (playerTerritories.length === 0) {
      p.fill(255, 100, 100);
      p.textSize(48);
      p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
      p.fill(200, 200, 200);
      p.textSize(24);
      p.text("You lost all territories", CANVAS_WIDTH / 2, 160);
    } else {
      p.fill(100, 255, 100);
      p.textSize(48);
      p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 100);
      p.fill(255, 255, 100);
      p.textSize(24);
      p.text("Advancing to next level...", CANVAS_WIDTH / 2, 160);
    }
  }
  
  p.fill(255, 255, 255);
  p.textSize(32);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  if (gameState.score > gameState.highScore) {
    p.fill(255, 255, 100);
    p.textSize(20);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 260);
  }
  
  p.fill(200, 200, 200);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}

function drawCombatResults(p) {
  const results = gameState.combatResults;
  
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 80, 300, 160);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("COMBAT!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  
  p.textSize(16);
  p.fill(100, 150, 255);
  p.text("Attacker Rolls:", CANVAS_WIDTH / 2 - 75, CANVAS_HEIGHT / 2 - 20);
  
  if (gameState.combatAnimationFrames < 30) {
    const animDice = [];
    for (let i = 0; i < results.attackerRolls.length; i++) {
      animDice.push(Math.floor(p.random(1, 7)));
    }
    p.text(animDice.join(", "), CANVAS_WIDTH / 2 - 75, CANVAS_HEIGHT / 2 + 5);
  } else {
    p.text(results.attackerRolls.join(", "), CANVAS_WIDTH / 2 - 75, CANVAS_HEIGHT / 2 + 5);
  }
  
  p.fill(255, 100, 100);
  p.text("Defender Rolls:", CANVAS_WIDTH / 2 + 75, CANVAS_HEIGHT / 2 - 20);
  
  if (gameState.combatAnimationFrames < 30) {
    const animDice = [];
    for (let i = 0; i < results.defenderRolls.length; i++) {
      animDice.push(Math.floor(p.random(1, 7)));
    }
    p.text(animDice.join(", "), CANVAS_WIDTH / 2 + 75, CANVAS_HEIGHT / 2 + 5);
  } else {
    p.text(results.defenderRolls.join(", "), CANVAS_WIDTH / 2 + 75, CANVAS_HEIGHT / 2 + 5);
  }
  
  if (gameState.combatAnimationFrames >= 30) {
    p.fill(255, 255, 100);
    p.textSize(14);
    p.text(`Attacker lost: ${results.attackerLosses}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
    p.text(`Defender lost: ${results.defenderLosses}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
  }
  
  p.pop();
}