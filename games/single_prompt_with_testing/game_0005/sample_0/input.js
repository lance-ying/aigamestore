// input.js - Input handling
import { GAME_PHASES, gameState, WORKSTATION_TYPES } from './globals.js';
import { Projectile } from './entities.js';
import { createCaptureParticles } from './collision.js';
import { Workstation } from './entities.js';

export function handlePlayerMovement(p) {
  const player = gameState.player;
  if (!player) return;
  
  let vx = 0;
  let vy = 0;
  
  if (p.keyIsDown(37)) vx -= 1; // LEFT
  if (p.keyIsDown(39)) vx += 1; // RIGHT
  if (p.keyIsDown(38)) vy -= 1; // UP
  if (p.keyIsDown(40)) vy += 1; // DOWN
  
  if (vx !== 0 || vy !== 0) {
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    vx = (vx / magnitude) * player.speed;
    vy = (vy / magnitude) * player.speed;
  }
  
  player.vx = vx;
  player.vy = vy;
}

export function handlePlayerAttack(p) {
  const player = gameState.player;
  if (!player || !player.canAttack()) return;
  
  // Find nearest target
  let nearestTarget = null;
  let nearestDist = 150;
  
  for (const pal of gameState.wildPals) {
    if (!pal.active) continue;
    const dx = pal.x - player.x;
    const dy = pal.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestTarget = pal;
    }
  }
  
  for (const poacher of gameState.poachers) {
    if (!poacher.active) continue;
    const dx = poacher.x - player.x;
    const dy = poacher.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestTarget = poacher;
    }
  }
  
  if (nearestTarget) {
    const dx = nearestTarget.x - player.x;
    const dy = nearestTarget.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 8;
    
    const proj = new Projectile(
      player.x,
      player.y,
      (dx / dist) * speed,
      (dy / dist) * speed,
      15,
      'player'
    );
    
    gameState.projectiles.push(proj);
    gameState.entities.push(proj);
    player.attack();
  }
}

export function handleCapture(p) {
  const player = gameState.player;
  if (!player) return;
  
  for (const pal of gameState.wildPals) {
    if (!pal.active || pal.isCaptured) continue;
    
    const dx = pal.x - player.x;
    const dy = pal.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 50 && pal.canBeCaptured()) {
      pal.capture();
      gameState.capturedPals.push(pal);
      gameState.wildPals = gameState.wildPals.filter(p => p !== pal);
      gameState.score += 50;
      createCaptureParticles(p, pal.x, pal.y);
      break;
    }
  }
}

let shiftHoldTime = 0;
let buildMenuOpen = false;
let selectedBuildType = null;

export function handleShiftInteraction(p) {
  const player = gameState.player;
  if (!player) return;
  
  if (p.keyIsDown(16)) { // SHIFT held
    shiftHoldTime++;
    
    if (shiftHoldTime > 30) {
      buildMenuOpen = true;
    } else {
      // Quick press - assign/unassign pals to nearby workstation
      if (shiftHoldTime === 1) {
        let nearestStation = null;
        let nearestDist = 60;
        
        for (const station of gameState.workstations) {
          const dx = station.x - player.x;
          const dy = station.y - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestStation = station;
          }
        }
        
        if (nearestStation) {
          if (nearestStation.assignedPal) {
            nearestStation.unassignPal();
          } else {
            // Find nearest unassigned captured pal
            let nearestPal = null;
            let nearestPalDist = 200;
            
            for (const pal of gameState.capturedPals) {
              if (!pal.active || pal.assignedStation) continue;
              const dx = pal.x - player.x;
              const dy = pal.y - player.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < nearestPalDist) {
                nearestPalDist = dist;
                nearestPal = pal;
              }
            }
            
            if (nearestPal) {
              nearestStation.assignPal(nearestPal);
            }
          }
        }
      }
    }
  } else {
    if (buildMenuOpen && shiftHoldTime > 30) {
      // Place workstation
      if (selectedBuildType) {
        const cost = selectedBuildType.cost;
        if (gameState.resources.food >= cost) {
          gameState.resources.food -= cost;
          const station = new Workstation(player.x + 50, player.y, selectedBuildType);
          gameState.workstations.push(station);
          gameState.entities.push(station);
        }
      }
    }
    shiftHoldTime = 0;
    buildMenuOpen = false;
    selectedBuildType = null;
  }
}

export function renderBuildMenu(p) {
  if (!buildMenuOpen) return;
  
  const menuWidth = 300;
  const menuHeight = 250;
  const menuX = (p.width - menuWidth) / 2;
  const menuY = (p.height - menuHeight) / 2;
  
  // Background
  p.fill(0, 0, 0, 200);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuWidth, menuHeight);
  
  // Title
  p.fill(255, 255, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text("BUILD WORKSTATION", menuX + menuWidth / 2, menuY + 10);
  
  // Instructions
  p.fill(200, 200, 200);
  p.textSize(10);
  p.text("Use Arrow Keys to select, release SHIFT to build", menuX + menuWidth / 2, menuY + 35);
  
  // List workstation types
  const types = Object.values(WORKSTATION_TYPES);
  let y = menuY + 60;
  
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const isSelected = (i === Math.floor((gameState.frameCount / 30) % types.length));
    
    if (isSelected) {
      selectedBuildType = type;
      p.fill(255, 255, 100, 100);
      p.noStroke();
      p.rect(menuX + 10, y - 5, menuWidth - 20, 35);
    }
    
    p.fill(...type.color);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(type.name, menuX + 20, y);
    
    p.fill(200, 200, 200);
    p.textSize(10);
    p.text(`Cost: ${type.cost} Food | Produces: ${type.produces}`, menuX + 20, y + 18);
    
    // Can afford indicator
    const canAfford = gameState.resources.food >= type.cost;
    p.fill(...(canAfford ? [100, 255, 100] : [255, 100, 100]));
    p.text(canAfford ? "✓" : "✗", menuX + menuWidth - 30, y + 5);
    
    y += 45;
  }
}