// screens.js - Game screen rendering functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState } from './globals.js';

export function drawStartScreen(p) {
  p.background(0);
  
  p.push();
  // Removed game name text from canvas as per feedback
  // p.fill(255, 255, 0);
  // p.textAlign(p.CENTER, p.CENTER);
  // p.textSize(48);
  // p.text("UNDERTALE", CANVAS_WIDTH / 2, 80);
  
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  
  const instructions = [
    "You are a human who fell into the Underground.",
    "Navigate encounters with monsters using the battle system.",
    "",
    "FIGHT - Deal damage to enemies",
    "ACT - Interact with enemies to find peaceful solutions",
    "SPARE - Let the enemy go when their name is YELLOW",
    "",
    "During enemy attacks:",
    "Arrow Keys - Move your SOUL to dodge",
    "Space - Quick dodge (cooldown)",
    "",
    "Survive three encounters to escape!",
    // Removed "PRESS ENTER TO START" as the HTML h1 now serves this purpose.
  ];
  
  let yPos = 140;
  for (let line of instructions) {
    if (line === "") {
      yPos += 10;
    } 
    // Removed specific handling for "PRESS ENTER TO START" line
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += line === "" ? 0 : 20;
  }
  
  p.pop();
}

export function drawGameOver(p, isWin) {
  p.background(0);
  
  p.push();
  if (isWin) {
    p.fill(255, 255, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text("YOU WON!", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(18);
    p.text("You escaped the Underground!", CANVAS_WIDTH / 2, 170);
    p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 210);
    p.text(`Enemies Spared: ${gameState.enemiesSpared}`, CANVAS_WIDTH / 2, 240);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 270); // Display final score
    
    if (gameState.enemiesSpared === gameState.totalEnemies) {
      p.fill(255, 255, 100);
      p.textSize(24);
      p.text("TRUE PACIFIST!", CANVAS_WIDTH / 2, 310); // Adjusted Y
      p.textSize(14);
      p.text("You didn't hurt anyone!", CANVAS_WIDTH / 2, 340); // Adjusted Y
    }
  } else {
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(18);
    p.text("You were defeated...", CANVAS_WIDTH / 2, 170);
    p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 210);
    p.text(`Enemies Spared: ${gameState.enemiesSpared}`, CANVAS_WIDTH / 2, 240);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 270); // Display final score
  }
  
  p.fill(255, 255, 0);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360); // Adjusted Y
  p.pop();
}

export function drawScore(p) {
  p.push();
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Score: ${gameState.score}`, 10, 10);
  p.text(`Defeated: ${gameState.enemiesDefeated} | Spared: ${gameState.enemiesSpared}`, 10, 25);
  p.text(`Encounter: ${gameState.enemyIndex + 1}/${gameState.totalEnemies}`, 10, 40);
  p.pop();
}