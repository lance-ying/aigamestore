// renderer.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, MUTATION_TYPES, MUTATION_COSTS } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 10, 30);
  
  // Title
  p.fill(150, 0, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("ZOMBIE NIGHT TERROR", CANVAS_WIDTH / 2, 80);

  // Subtitle
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text("Spread the Infection", CANVAS_WIDTH / 2, 130);

  // Instructions
  p.fill(180, 180, 180);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE: Convert all humans to zombies!",
    "",
    "CONTROLS:",
    "  Arrow Keys - Pan camera left/right",
    "  Space - Select zombie at cursor",
    "  Z - Cycle mutations",
    "  Shift - Apply mutation (costs DNA)",
    "",
    "MUTATIONS:",
    "  Overlord (15 DNA) - Guide zombie to humans",
    "  Exploder (25 DNA) - Destroy walls",
    "  Runner (10 DNA) - Boost speed",
    "",
    "Convert humans to gain DNA points!",
    "Destroy destructible walls to access areas.",
    "Avoid hazards - they kill zombies!"
  ];

  let yPos = 170;
  for (const line of instructions) {
    p.text(line, 80, yPos);
    yPos += 16;
  }

  // Start prompt
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const alpha = 128 + 127 * p.sin(p.frameCount * 0.1);
  p.fill(255, 255, 0, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function drawPlayingScreen(p) {
  // Background
  p.background(30, 30, 50);

  // Draw ground
  p.fill(40, 40, 40);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);

  // Draw all entities
  for (const entity of gameState.entities) {
    if (entity.draw) {
      entity.draw();
    }
  }

  // Draw explosions
  for (let i = gameState.explosions.length - 1; i >= 0; i--) {
    const exp = gameState.explosions[i];
    const screenX = exp.x - gameState.cameraX;
    
    exp.radius += (exp.maxRadius - exp.radius) * 0.3;
    exp.timer--;

    if (exp.timer <= 0) {
      gameState.explosions.splice(i, 1);
      continue;
    }

    const alpha = (exp.timer / 30) * 200;
    p.fill(255, 100, 0, alpha);
    p.noStroke();
    p.ellipse(screenX, exp.y, exp.radius * 2, exp.radius * 2);
    p.fill(255, 200, 0, alpha * 0.5);
    p.ellipse(screenX, exp.y, exp.radius, exp.radius);
  }

  // Draw selector cursor
  p.stroke(255, 255, 0);
  p.strokeWeight(2);
  p.noFill();
  p.line(gameState.selectorX, 0, gameState.selectorX, CANVAS_HEIGHT);
  p.ellipse(gameState.selectorX, CANVAS_HEIGHT / 2, 20, 20);

  // Highlight selected zombie
  if (gameState.selectedZombie) {
    const zombie = gameState.selectedZombie;
    const screenX = zombie.x - gameState.cameraX;
    p.stroke(0, 255, 255);
    p.strokeWeight(2);
    p.noFill();
    p.rect(screenX - 2, zombie.y - 2, zombie.width + 4, zombie.height + 4);
  }

  // UI
  drawUI(p);
}

function drawUI(p) {
  // DNA Points
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(10, 10, 200, 80);

  p.fill(0, 255, 0);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`DNA: ${gameState.dnaPoints}`, 20, 20);
  p.text(`Score: ${gameState.score}`, 20, 40);
  p.text(`Humans: ${gameState.humans.length}/${gameState.totalHumans}`, 20, 60);

  // Mutation UI
  p.fill(0, 0, 0, 150);
  p.rect(10, 100, 200, 120);

  p.fill(255, 255, 255);
  p.textSize(12);
  p.text("Selected Mutation:", 20, 110);

  const mutations = [
    { type: MUTATION_TYPES.OVERLORD, name: "Overlord", cost: MUTATION_COSTS.OVERLORD, color: [255, 100, 255] },
    { type: MUTATION_TYPES.EXPLODER, name: "Exploder", cost: MUTATION_COSTS.EXPLODER, color: [255, 50, 50] },
    { type: MUTATION_TYPES.RUNNER, name: "Runner", cost: MUTATION_COSTS.RUNNER, color: [0, 255, 255] }
  ];

  let yPos = 130;
  for (const mut of mutations) {
    const isSelected = gameState.selectedMutation === mut.type;
    const cooldown = gameState.mutationCooldowns[mut.type];
    const canAfford = gameState.dnaPoints >= mut.cost;

    if (isSelected) {
      p.fill(255, 255, 0);
      p.text(">", 20, yPos);
    }

    const textColor = (cooldown > 0 || !canAfford) ? [100, 100, 100] : mut.color;
    p.fill(...textColor);
    p.text(`${mut.name} (${mut.cost})`, 35, yPos);

    if (cooldown > 0) {
      p.text(`[${Math.ceil(cooldown / 60)}s]`, 140, yPos);
    }

    yPos += 20;
  }

  p.fill(150, 150, 150);
  p.textSize(10);
  p.text("Z: cycle | Shift: apply", 20, 200);

  // Selected zombie info
  if (gameState.selectedZombie) {
    p.fill(0, 0, 0, 150);
    p.rect(CANVAS_WIDTH - 210, 10, 200, 60);
    p.fill(0, 255, 255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text("Zombie Selected", CANVAS_WIDTH - 200, 20);
    if (gameState.selectedZombie.mutation) {
      p.text(`Mutation: ${gameState.selectedZombie.mutation}`, CANVAS_WIDTH - 200, 40);
    }
  }
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Paused text
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  p.textSize(16);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function drawGameOverScreen(p) {
  p.background(20, 10, 30);

  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;

  // Title
  p.fill(isWin ? [0, 255, 0] : [255, 0, 0]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(isWin ? "INFECTION COMPLETE!" : "HORDE ELIMINATED", CANVAS_WIDTH / 2, 100);

  // Stats
  p.fill(200, 200, 200);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Humans Converted: ${gameState.humansConverted}`, CANVAS_WIDTH / 2, 220);

  if (isWin) {
    p.textSize(16);
    p.text("You successfully spread the zombie plague!", CANVAS_WIDTH / 2, 260);
  } else {
    p.textSize(16);
    p.text("Your zombie horde was wiped out.", CANVAS_WIDTH / 2, 260);
  }

  // Restart prompt
  p.fill(255, 255, 0);
  p.textSize(18);
  const alpha = 128 + 127 * p.sin(p.frameCount * 0.1);
  p.fill(255, 255, 0, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}