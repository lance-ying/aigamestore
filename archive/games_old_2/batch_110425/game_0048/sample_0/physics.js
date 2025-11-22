import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState } from './globals.js';

export function setupCollisionHandling(p) {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      
      // Star collection
      if ((bodyA.label === 'candy' && bodyB.label === 'star') ||
          (bodyA.label === 'star' && bodyB.label === 'candy')) {
        const star = gameState.stars.find(s => 
          s.body === bodyA || s.body === bodyB
        );
        if (star && !star.collected) {
          star.collect();
          gameState.starsCollected++;
          gameState.score += 100;
          
          p.logs.game_info.push({
            data: { event: 'star_collected', starsCollected: gameState.starsCollected },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      // Monster feeding
      if ((bodyA.label === 'candy' && bodyB.label.startsWith('monster_')) ||
          (bodyA.label.startsWith('monster_') && bodyB.label === 'candy')) {
        const monsterLabel = bodyA.label.startsWith('monster_') ? bodyA.label : bodyB.label;
        const monster = gameState.monsters.find(m => m.body.label === monsterLabel);
        
        if (monster && !monster.fed && gameState.candy && !gameState.candy.collected) {
          monster.feed();
          gameState.monstersEaten++;
          gameState.candy.collected = true;
          
          p.logs.game_info.push({
            data: { event: 'monster_fed', monstersEaten: gameState.monstersEaten },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
          
          // Check win condition
          if (gameState.monstersEaten >= gameState.monsters.length) {
            gameState.gamePhase = 'GAME_OVER_WIN';
            gameState.score += gameState.starsCollected * 50;
            
            p.logs.game_info.push({
              data: { gamePhase: 'GAME_OVER_WIN', finalScore: gameState.score },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          }
        }
      }
      
      // Bubble activation
      if ((bodyA.label === 'candy' && bodyB.label === 'bubble') ||
          (bodyA.label === 'bubble' && bodyB.label === 'candy')) {
        const bubble = gameState.devices.find(d => 
          d.body === bodyA || d.body === bodyB
        );
        if (bubble && !bubble.activated && gameState.candy) {
          bubble.activate(gameState.candy);
        }
      }
      
      // Air cushion activation
      if ((bodyA.label === 'candy' && bodyB.label === 'cushion') ||
          (bodyA.label === 'cushion' && bodyB.label === 'candy')) {
        const cushion = gameState.devices.find(d => 
          d.body === bodyA || d.body === bodyB
        );
        if (cushion && gameState.candy) {
          cushion.activate(gameState.candy);
        }
      }
    });
  });
}