// rendering.js - Game rendering functions

import { gameState, GAME_PHASES } from './globals.js';
import { drawStartScreen, drawGameOverScreen, drawUI } from './ui.js';

export function drawGame(p) {
  // Background
  p.background(40, 60, 40);

  // Draw path
  drawPath(p);

  // Draw tower plots
  for (let plot of gameState.towerPlots) {
    plot.draw(p);
  }

  // Highlight hovered plot for tower placement
  if (gameState.hoveredPlot && !gameState.hoveredPlot.occupied) {
    p.push();
    p.noFill();
    p.stroke(100, 255, 100, 150);
    p.strokeWeight(3);
    p.rect(
      gameState.hoveredPlot.x - gameState.hoveredPlot.size / 2,
      gameState.hoveredPlot.y - gameState.hoveredPlot.size / 2,
      gameState.hoveredPlot.size,
      gameState.hoveredPlot.size
    );
    p.pop();
  }

  // Draw entities
  for (let tower of gameState.towers) {
    tower.draw(p);
  }

  for (let projectile of gameState.projectiles) {
    projectile.draw(p);
  }

  for (let enemy of gameState.enemies) {
    enemy.draw(p);
  }

  for (let hero of gameState.heroes) {
    hero.draw(p);
  }

  for (let particle of gameState.particles) {
    particle.draw(p);
  }

  // Draw UI
  drawUI(p);
}

export function drawPath(p) {
  const path = gameState.path;
  
  p.push();
  p.noFill();
  p.stroke(80, 70, 60);
  p.strokeWeight(40);
  p.strokeCap(p.ROUND);
  p.strokeJoin(p.ROUND);
  
  p.beginShape();
  for (let waypoint of path) {
    p.vertex(waypoint.x, waypoint.y);
  }
  p.endShape();

  // Center line
  p.stroke(90, 80, 70);
  p.strokeWeight(4);
  p.beginShape();
  for (let waypoint of path) {
    p.vertex(waypoint.x, waypoint.y);
  }
  p.endShape();

  p.pop();
}

export function render(p) {
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      drawStartScreen(p);
      break;
    case GAME_PHASES.PLAYING:
    case GAME_PHASES.PAUSED:
      drawGame(p);
      break;
    case GAME_PHASES.GAME_OVER_WIN:
    case GAME_PHASES.GAME_OVER_LOSE:
      drawGame(p);
      drawGameOverScreen(p);
      break;
  }
}