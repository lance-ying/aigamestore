// attacks.js - Boss attack pattern implementations

import { BossProjectile } from './projectiles.js';
import { gameState } from './globals.js';

export function executeAttack(p, boss, attackType) {
  const centerX = boss.x + boss.width / 2;
  const centerY = boss.y + boss.height / 2;
  const projectiles = [];
  
  switch (attackType) {
    case 'spread':
      // Fan of projectiles
      for (let i = 0; i < 5; i++) {
        const angle = p.PI / 3 + (i * p.PI / 12);
        const speed = 4;
        projectiles.push(new BossProjectile(
          p,
          centerX,
          centerY,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          'normal'
        ));
      }
      break;
      
    case 'aimed':
      // Aim at player
      if (gameState.player) {
        const playerX = gameState.player.x + gameState.player.width / 2;
        const playerY = gameState.player.y + gameState.player.height / 2;
        const angle = Math.atan2(playerY - centerY, playerX - centerX);
        const speed = 5;
        
        // Shoot 3 projectiles in a slight spread
        for (let i = -1; i <= 1; i++) {
          const spreadAngle = angle + (i * 0.15);
          projectiles.push(new BossProjectile(
            p,
            centerX,
            centerY,
            Math.cos(spreadAngle) * speed,
            Math.sin(spreadAngle) * speed,
            i === 0 ? 'large' : 'normal'
          ));
        }
      }
      break;
      
    case 'wave':
      // Wave pattern
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * p.TWO_PI;
        const speed = 3;
        projectiles.push(new BossProjectile(
          p,
          centerX,
          centerY,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          'normal'
        ));
      }
      break;
      
    case 'spiral':
      // Spiral pattern
      const spiralCount = 12;
      for (let i = 0; i < spiralCount; i++) {
        const angle = (i / spiralCount) * p.TWO_PI + p.frameCount * 0.1;
        const speed = 3.5;
        projectiles.push(new BossProjectile(
          p,
          centerX,
          centerY,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          'normal'
        ));
      }
      break;
      
    case 'barrage':
      // Random barrage
      for (let i = 0; i < 6; i++) {
        const angle = p.random(p.PI / 4, p.PI * 3 / 4);
        const speed = 3 + p.random(2);
        projectiles.push(new BossProjectile(
          p,
          centerX + p.random(-20, 20),
          centerY,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          p.random() > 0.7 ? 'large' : 'normal'
        ));
      }
      break;
      
    case 'cross':
      // Cross pattern
      const directions = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]
      ];
      directions.forEach(dir => {
        const speed = 4;
        projectiles.push(new BossProjectile(
          p,
          centerX,
          centerY,
          dir[0] * speed,
          dir[1] * speed,
          'normal'
        ));
      });
      break;
  }
  
  return projectiles;
}