// collision.js - Collision detection and handling

export function checkCircleRectCollision(p, circle, rect) {
  return p.collideCircleCircle(
    circle.x, circle.y, circle.radius * 2,
    rect.x + rect.width / 2, rect.y + rect.height / 2,
    Math.max(rect.width, rect.height)
  );
}

export function checkRectRectCollision(p, rect1, rect2) {
  return p.collideRectRect(
    rect1.x, rect1.y, rect1.width, rect1.height,
    rect2.x, rect2.y, rect2.width, rect2.height
  );
}

export function handlePlayerProjectileCollisions(p, projectiles, boss) {
  let hitCount = 0;
  
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    const projHitbox = proj.getHitbox();
    const bossHitbox = boss.getHitbox();
    
    if (checkCircleRectCollision(p, 
        { x: proj.x, y: proj.y, radius: projHitbox.radius }, 
        bossHitbox)) {
      boss.takeDamage(proj.damage);
      projectiles.splice(i, 1);
      hitCount++;
    }
  }
  
  return hitCount;
}

export function handleBossProjectileCollisions(p, projectiles, player) {
  let hitCount = 0;
  
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    const projHitbox = proj.getHitbox();
    const playerHitbox = player.getHitbox();
    
    if (checkCircleRectCollision(p,
        { x: proj.x, y: proj.y, radius: projHitbox.radius },
        playerHitbox)) {
      if (player.takeDamage(proj.damage)) {
        hitCount++;
      }
      projectiles.splice(i, 1);
    }
  }
  
  return hitCount;
}