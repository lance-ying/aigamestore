// collision.js
import { gameState } from './globals.js';

export function checkCollisions(p) {
  const player = gameState.player;

  // Check memory fragment collection
  for (const fragment of gameState.memoryFragments) {
    if (!fragment.collected) {
      const dist = p.dist(player.x, player.y, fragment.x, fragment.y);
      if (dist < player.size + fragment.size) {
        fragment.collected = true;
        gameState.memoriesCollected++;
        gameState.score += 100;
        
        // Activate portal if enough memories collected
        if (gameState.memoriesCollected >= 10) {
          gameState.portal.active = true;
        }
      }
    }
  }

  // Check NPC interactions (handled by input, but we need proximity check)
  for (const npc of gameState.npcs) {
    const dist = p.dist(player.x, player.y, npc.x, npc.y);
    // Store proximity for interaction system
    npc.inRange = dist < player.size + npc.size + 30;
  }

  // Check hostile collisions
  for (const hostile of gameState.hostiles) {
    const dist = p.dist(player.x, player.y, hostile.x, hostile.y);
    if (dist < player.size + hostile.size) {
      if (hostile.attackCooldown === 0) {
        const damaged = player.takeDamage(hostile.damage);
        if (damaged) {
          hostile.attackCooldown = 60; // 1 second cooldown
          gameState.score = Math.max(0, gameState.score - 10);
        }
      }
    }
  }

  // Check portal entry
  if (gameState.portal.active) {
    const dist = p.dist(player.x, player.y, gameState.portal.x, gameState.portal.y);
    if (dist < player.size + gameState.portal.size) {
      gameState.portal.canEnter = true;
    } else {
      gameState.portal.canEnter = false;
    }
  }
}

export function handleNPCInteraction(p) {
  const player = gameState.player;
  
  if (player.interactionCooldown > 0) return;

  for (const npc of gameState.npcs) {
    if (npc.inRange && !npc.hasInteracted) {
      npc.hasInteracted = true;
      player.interactionCooldown = 30;
      gameState.npcInteractions++;
      gameState.score += 50;

      // Determine player path based on interactions
      if (gameState.npcInteractions >= 5) {
        gameState.playerPath = "kind";
      }

      // Small health boost for friendly interactions
      if (npc.type === "friendly") {
        player.health = Math.min(player.health + 10, 100);
      }
      
      break; // Only one interaction per press
    }
  }
}

export function handlePortalEntry(p) {
  if (gameState.portal.active && gameState.portal.canEnter) {
    // Win condition
    endGame(p, true);
  }
}

export function endGame(p, won) {
  if (won) {
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", memoriesCollected: gameState.memoriesCollected, score: gameState.score, path: gameState.playerPath },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.gamePhase = "GAME_OVER_LOSE";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", memoriesCollected: gameState.memoriesCollected, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  p.noLoop();
}