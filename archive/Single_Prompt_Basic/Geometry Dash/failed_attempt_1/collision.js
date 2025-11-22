export function checkCollision(entity1, entity2) {
  const a = entity1.getHitbox();
  const b = entity2.getHitbox();
  
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

export function checkPitCollision(player, pit) {
  const playerHitbox = player.getHitbox();
  const pitHitbox = pit.getHitbox();
  
  // Check if player is above the pit (x overlap) and below the ground level
  return playerHitbox.x + playerHitbox.width > pitHitbox.x &&
         playerHitbox.x < pitHitbox.x + pitHitbox.width &&
         playerHitbox.y + playerHitbox.height >= pitHitbox.y;
}