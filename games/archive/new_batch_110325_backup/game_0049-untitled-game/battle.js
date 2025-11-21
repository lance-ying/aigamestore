// battle.js - Battle system
import { gameState, OPPONENTS, GAME_PHASES } from './globals.js';
import { calculateDamage, getTotalStats, resetBattle } from './utils.js';

export function startBattle(opponent) {
  gameState.inBattle = true;
  gameState.currentOpponent = { ...opponent };
  gameState.battleTurn = "PLAYER";
  
  const playerStats = getTotalStats(gameState.player);
  gameState.playerBattleHealth = playerStats.health;
  gameState.opponentBattleHealth = opponent.health;
  gameState.battleLog = [`Battle started against ${opponent.name}!`];
  gameState.selectedAction = 0;
  gameState.battleAction = null;
}

export function updateBattle(p) {
  if (!gameState.inBattle) return;
  
  gameState.framesSinceAction++;
  
  // Auto-execute opponent turn after delay
  if (gameState.battleTurn === "OPPONENT" && gameState.framesSinceAction > 90) {
    executeOpponentTurn();
  }
  
  // Check for battle end
  if (gameState.playerBattleHealth <= 0) {
    endBattle(false);
  } else if (gameState.opponentBattleHealth <= 0) {
    endBattle(true);
  }
}

export function handleBattleInput(keyCode, p) {
  if (gameState.battleTurn !== "PLAYER") return;
  if (gameState.battleAction) return; // Action already selected
  
  // Select action with arrow keys
  if (keyCode === 38 || keyCode === 37) { // UP or LEFT
    gameState.selectedAction = Math.max(0, gameState.selectedAction - 1);
  } else if (keyCode === 40 || keyCode === 39) { // DOWN or RIGHT
    gameState.selectedAction = Math.min(2, gameState.selectedAction + 1);
  } else if (keyCode === 32) { // SPACE to confirm
    executeBattleAction(gameState.selectedAction);
  }
}

function executeBattleAction(actionIndex) {
  const playerStats = getTotalStats(gameState.player);
  const opponent = gameState.currentOpponent;
  
  if (actionIndex === 0) { // Attack
    const damage = calculateDamage(
      { power: playerStats.power, defence: 0 },
      { power: 0, defence: opponent.defence }
    );
    gameState.opponentBattleHealth -= damage;
    gameState.battleLog.push(`You dealt ${damage} damage!`);
  } else if (actionIndex === 1) { // Special Attack
    const damage = Math.floor(calculateDamage(
      { power: playerStats.power + playerStats.special, defence: 0 },
      { power: 0, defence: opponent.defence }
    ) * 1.5);
    gameState.opponentBattleHealth -= damage;
    gameState.battleLog.push(`Special Attack! Dealt ${damage} damage!`);
  } else if (actionIndex === 2) { // Defend
    gameState.battleLog.push(`You brace for impact!`);
  }
  
  gameState.battleAction = actionIndex;
  gameState.battleTurn = "OPPONENT";
  gameState.framesSinceAction = 0;
  
  // Keep battle log manageable
  if (gameState.battleLog.length > 4) {
    gameState.battleLog.shift();
  }
}

function executeOpponentTurn() {
  const opponent = gameState.currentOpponent;
  const playerStats = getTotalStats(gameState.player);
  
  // Simple AI - attack most of the time
  const action = Math.random() > 0.2 ? 0 : 1;
  
  let damage = calculateDamage(
    { power: opponent.power, defence: 0 },
    { power: 0, defence: playerStats.defence }
  );
  
  // Reduce damage if player defended
  if (gameState.battleAction === 2) {
    damage = Math.floor(damage * 0.5);
  }
  
  gameState.playerBattleHealth -= damage;
  gameState.battleLog.push(`${opponent.name} dealt ${damage} damage!`);
  
  gameState.battleTurn = "PLAYER";
  gameState.battleAction = null;
  gameState.framesSinceAction = 0;
  
  if (gameState.battleLog.length > 4) {
    gameState.battleLog.shift();
  }
}

function endBattle(playerWon) {
  if (playerWon) {
    gameState.player.wins++;
    gameState.player.currency += gameState.currentOpponent.reward;
    gameState.defeatedOpponents.push(gameState.currentOpponent.id);
    
    // Check win condition - defeat all 5 opponents
    if (gameState.defeatedOpponents.length >= 5) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    }
  } else {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
  
  resetBattle();
  gameState.screen = 'WORLD';
}

export function renderBattle(p) {
  if (!gameState.inBattle) return;
  
  // Background
  p.fill(40, 40, 60);
  p.rect(0, 0, 600, 400);
  
  // Arena floor
  p.fill(60, 50, 40);
  p.rect(0, 300, 600, 100);
  
  // Player duck
  const playerStats = getTotalStats(gameState.player);
  drawBattleDuck(p, 150, 250, 40, [255, 200, 0], false);
  
  // Player health bar
  drawHealthBar(p, 50, 200, gameState.playerBattleHealth, playerStats.health);
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Your Duck", 50, 175);
  
  // Opponent duck
  const opponent = gameState.currentOpponent;
  drawBattleDuck(p, 450, 250, 40, [255, 100, 100], true);
  
  // Opponent health bar
  drawHealthBar(p, 350, 200, gameState.opponentBattleHealth, opponent.health);
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.text(opponent.name, 350, 175);
  
  // Battle log
  p.fill(0, 0, 0, 150);
  p.rect(50, 320, 500, 70);
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  for (let i = 0; i < gameState.battleLog.length; i++) {
    p.text(gameState.battleLog[i], 60, 325 + i * 15);
  }
  
  // Action menu (only during player turn)
  if (gameState.battleTurn === "PLAYER" && !gameState.battleAction) {
    p.fill(0, 0, 0, 200);
    p.rect(200, 100, 200, 120);
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    
    const actions = ["Attack", "Special Attack", "Defend"];
    for (let i = 0; i < actions.length; i++) {
      const selected = i === gameState.selectedAction;
      p.fill(...(selected ? [255, 255, 0] : [255, 255, 255]));
      p.text((selected ? "> " : "  ") + actions[i], 300, 130 + i * 30);
    }
    
    p.fill(200);
    p.textSize(12);
    p.text("SPACE to confirm", 300, 210);
  }
  
  // Turn indicator
  p.fill(255, 255, 0);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  p.text(gameState.battleTurn === "PLAYER" ? "Your Turn!" : "Opponent's Turn", 300, 10);
}

function drawHealthBar(p, x, y, current, max) {
  const width = 200;
  const height = 20;
  const ratio = Math.max(0, current) / max;
  
  // Background
  p.fill(100, 50, 50);
  p.rect(x, y, width, height);
  
  // Health
  p.fill(100, 255, 100);
  p.rect(x, y, width * ratio, height);
  
  // Border
  p.noFill();
  p.stroke(255);
  p.rect(x, y, width, height);
  p.noStroke();
  
  // Text
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${Math.max(0, Math.floor(current))} / ${max}`, x + width / 2, y + height / 2);
}

function drawBattleDuck(p, x, y, size, color, flip) {
  p.push();
  p.translate(x, y);
  if (flip) p.scale(-1, 1);
  
  // Body
  p.fill(...color);
  p.ellipse(0, 0, size * 1.8, size * 1.2);
  
  // Head
  p.ellipse(-size * 0.6, -size * 0.7, size * 1.2, size * 1.2);
  
  // Beak
  p.fill(255, 150, 0);
  p.triangle(-size * 1.0, -size * 0.7, -size * 1.5, -size * 0.5, -size * 1.5, -size * 0.9);
  
  // Eye
  p.fill(0);
  p.circle(-size * 0.7, -size * 0.8, size * 0.25);
  
  // Wing
  p.fill(...color.map(c => c * 0.8));
  p.ellipse(size * 0.3, 0, size * 0.8, size * 0.6);
  
  // Feet
  p.fill(255, 150, 0);
  p.ellipse(-size * 0.3, size * 0.6, size * 0.4, size * 0.3);
  p.ellipse(size * 0.3, size * 0.6, size * 0.4, size * 0.3);
  
  p.pop();
}