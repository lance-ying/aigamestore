// ui.js - UI rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  MUTATION_BLOCKER,
  MUTATION_EXPLODER,
  MUTATION_JUMPER,
  MUTATION_RUNNER,
  MUTATION_TANK,
  MUTATION_COSTS
} from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(150, 255, 150);
  p.textSize(36);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("ZOMBIE NIGHT TERROR", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text("Command the Horde", CANVAS_WIDTH / 2, 95);
  
  // Description
  p.fill(180, 180, 180);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const description = [
    "Your zombies walk automatically. Use mutations to overcome",
    "obstacles and infect all humans. Reach the exit with enough",
    "zombies to win. Don't let critical humans escape!"
  ];
  for (let i = 0; i < description.length; i++) {
    p.text(description[i], 50, 130 + i * 18);
  }
  
  // Instructions
  p.fill(220, 220, 150);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "CONTROLS:",
    "  Arrow Keys: Pan camera",
    "  1-5: Select mutation",
    "  Space: Apply mutation to nearest zombie",
    "  Z: Quick-select Blocker",
    "  Shift: Speed up time",
    "",
    "MUTATIONS:",
    "  1. Blocker (10pts) - Stop zombie in place",
    "  2. Exploder (15pts) - Destroy obstacles",
    "  3. Jumper (12pts) - Cross gaps",
    "  4. Runner (8pts) - Move faster",
    "  5. Tank (20pts) - Strong zombie"
  ];
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], 50, 200 + i * 15);
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderGameUI(p) {
  // HUD background
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, 30);
  
  // Score
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Score: ${gameState.score}`, 10, 8);
  
  // Mutation points
  p.fill(150, 255, 150);
  p.text(`Mutation Points: ${gameState.mutationPoints}`, 120, 8);
  
  // Zombie count
  p.fill(100, 200, 100);
  p.text(`Zombies: ${gameState.zombieCount}`, 300, 8);
  
  // Human count
  p.fill(200, 150, 150);
  p.text(`Humans: ${gameState.humanCount - gameState.zombies.filter(z => z.active).length + gameState.zombieCount}`, 400, 8);
  
  // Min horde size
  p.fill(200, 200, 100);
  p.text(`Need: ${gameState.minHordeSize}`, 500, 8);
  
  // Mutation UI at bottom
  renderMutationUI(p);
}

export function renderMutationUI(p) {
  const uiY = CANVAS_HEIGHT - 60;
  const mutations = [
    { name: "Blocker", key: "1", type: MUTATION_BLOCKER, color: [150, 150, 200] },
    { name: "Exploder", key: "2", type: MUTATION_EXPLODER, color: [200, 100, 100] },
    { name: "Jumper", key: "3", type: MUTATION_JUMPER, color: [100, 200, 200] },
    { name: "Runner", key: "4", type: MUTATION_RUNNER, color: [200, 200, 100] },
    { name: "Tank", key: "5", type: MUTATION_TANK, color: [150, 100, 150] }
  ];
  
  p.fill(0, 0, 0, 180);
  p.rect(0, uiY - 10, CANVAS_WIDTH, 70);
  
  const spacing = CANVAS_WIDTH / mutations.length;
  
  for (let i = 0; i < mutations.length; i++) {
    const mut = mutations[i];
    const x = spacing * i + spacing / 2;
    const y = uiY + 20;
    
    const isSelected = gameState.selectedMutation === mut.type;
    const canAfford = gameState.mutationPoints >= MUTATION_COSTS[mut.type];
    
    // Background
    if (isSelected) {
      p.fill(255, 255, 150, 100);
      p.rect(x - 45, y - 25, 90, 50);
    }
    
    // Icon
    p.fill(...(canAfford ? mut.color : mut.color.map(c => c * 0.4)));
    p.rect(x - 15, y - 10, 30, 30);
    
    // Name and cost
    p.fill(255, 255, 255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(mut.name, x, y - 20);
    p.text(`${mut.key}: ${MUTATION_COSTS[mut.type]}pts`, x, y + 25);
  }
  
  // Instructions
  p.fill(200, 200, 200);
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("SPACE to apply mutation", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8);
}

export function renderPauseIndicator(p) {
  p.fill(255, 255, 255);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOverScreen(p, isWin) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result message
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(42);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  } else {
    p.fill(255, 100, 100);
    p.textSize(42);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  }
  
  // Final score
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Stats
  p.textSize(16);
  p.text(`Zombies: ${gameState.zombieCount}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  // Restart prompt
  p.fill(200, 200, 200);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderBackground(p, cameraX) {
  // Sky
  p.background(40, 30, 60);
  
  // Stars (parallax effect)
  p.fill(255, 255, 255);
  p.noStroke();
  for (let i = 0; i < 30; i++) {
    const starX = (i * 137 + cameraX * 0.2) % CANVAS_WIDTH;
    const starY = (i * 79) % 300;
    p.circle(starX, starY, 2);
  }
  
  // Ground
  const groundY = 350;
  p.fill(60, 50, 40);
  p.rect(0, groundY, CANVAS_WIDTH, CANVAS_HEIGHT - groundY);
  
  // Ground details
  p.fill(50, 40, 30);
  for (let i = 0; i < 20; i++) {
    const detailX = ((i * 87 - cameraX * 0.5) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
    const detailY = groundY + (i * 13) % 30 + 10;
    p.rect(detailX, detailY, 15, 3);
  }
}