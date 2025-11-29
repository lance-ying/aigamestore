// testing.js - Automated testing controllers
import { gameState, PHASE_PLAYING } from './globals.js';

export function updateTestingController(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.controlMode === 'HUMAN') return;

  if (gameState.controlMode === 'TEST_1') {
    testBasicMovement(p);
  } else if (gameState.controlMode === 'TEST_2') {
    testWinScenario(p);
  }
}

function testBasicMovement(p) {
  const player = gameState.player;
  if (!player) return;

  // Simple patrol pattern
  if (p.frameCount % 60 === 0) {
    const action = Math.floor(p.frameCount / 60) % 8;
    
    switch(action) {
      case 0:
        player.moveTo(player.gridX + 2, player.gridY, gameState.walls);
        break;
      case 1:
        player.moveTo(player.gridX, player.gridY + 2, gameState.walls);
        break;
      case 2:
        player.moveTo(player.gridX - 2, player.gridY, gameState.walls);
        break;
      case 3:
        player.moveTo(player.gridX, player.gridY - 2, gameState.walls);
        break;
      case 4:
      case 5:
      case 6:
      case 7:
        const interactable = player.getNearbyInteractable();
        if (interactable) {
          const duration = interactable.type === 'clean' ? 
            3000 / gameState.upgrades.playerCleanSpeed :
            interactable.type === 'checkin' ?
            2500 / gameState.upgrades.playerCheckinSpeed : 1500;
          player.startTask(interactable.type, interactable.target, duration);
        }
        break;
    }
  }
}

function testWinScenario(p) {
  const player = gameState.player;
  if (!player) return;

  // Aggressive task completion
  if (p.frameCount % 30 === 0) {
    const interactable = player.getNearbyInteractable();
    if (interactable) {
      const duration = interactable.type === 'clean' ? 
        3000 / gameState.upgrades.playerCleanSpeed :
        interactable.type === 'checkin' ?
        2500 / gameState.upgrades.playerCheckinSpeed : 1500;
      player.startTask(interactable.type, interactable.target, duration);
    } else {
      // Move towards nearest task
      const dirtyRooms = gameState.rooms.filter(r => r.status === 'DIRTY');
      const waitingGuests = gameState.guests.filter(g => g.status === 'WAITING');
      const checkoutGuests = gameState.guests.filter(g => g.status === 'CHECKING_OUT');
      
      let target = null;
      let minDist = Infinity;
      
      for (const room of dirtyRooms) {
        const centerX = room.x + room.w / 2;
        const centerY = room.y + room.h / 2;
        const dist = Math.sqrt(
          Math.pow(player.gridX - centerX, 2) + Math.pow(player.gridY - centerY, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          target = { x: Math.floor(centerX), y: Math.floor(centerY) };
        }
      }
      
      for (const guest of waitingGuests) {
        const dist = Math.sqrt(
          Math.pow(player.gridX - guest.waitX, 2) + Math.pow(player.gridY - guest.waitY, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          target = { x: guest.waitX, y: guest.waitY };
        }
      }
      
      for (const guest of checkoutGuests) {
        const dist = Math.sqrt(
          Math.pow(player.gridX - guest.x - 2, 2) + Math.pow(player.gridY - guest.y - 1.5, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          target = { x: guest.x + 2, y: guest.y + 1 };
        }
      }
      
      if (target) {
        const dx = Math.sign(target.x - player.gridX);
        const dy = Math.sign(target.y - player.gridY);
        
        if (Math.abs(dx) > Math.abs(dy)) {
          player.moveTo(player.gridX + dx, player.gridY, gameState.walls);
        } else {
          player.moveTo(player.gridX, player.gridY + dy, gameState.walls);
        }
      }
    }
  }

  // Auto-purchase upgrades
  if (p.frameCount % 120 === 0) {
    const config = require('./globals.js').getCurrentLevelConfig();
    for (let i = 0; i < config.upgrades.length; i++) {
      const upg = config.upgrades[i];
      if (!gameState.upgrades.purchased?.[upg.id] && gameState.currentMoney >= upg.cost) {
        // Simulate purchase
        handleKeyPressed(p, (i + 1).toString(), 49 + i);
      }
    }
  }
}