// collision.js - Collision detection helpers

export function circleCircleCollision(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (r1 + r2);
}

export function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rx - rw / 2, Math.min(cx, rx + rw / 2));
  const closestY = Math.max(ry - rh / 2, Math.min(cy, ry + rh / 2));
  
  // Calculate distance between circle center and closest point
  const dx = cx - closestX;
  const dy = cy - closestY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < cr;
}