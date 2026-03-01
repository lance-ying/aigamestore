// game_logic.js - Core game logic and updates
import { gameState, WIN_CONDITION } from './globals.js';
import { GoldenCookie } from './golden_cookie.js';

export function updateGame(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  gameState.frameCounter++;
  
  // Calculate cookies per second
  let totalCps = 0;
  for (let building of gameState.buildings) {
    totalCps += building.getCps();
  }
  gameState.cookiesPerSecond = totalCps;
  
  // Add passive cookies (per frame)
  const cookiesThisFrame = totalCps / 60;
  gameState.cookies += cookiesThisFrame;
  gameState.totalCookiesEarned += cookiesThisFrame;
  
  // Update golden cookies
  for (let i = gameState.goldenCookies.length - 1; i >= 0; i--) {
    gameState.goldenCookies[i].update();
    if (gameState.goldenCookies[i].isExpired()) {
      gameState.goldenCookies.splice(i, 1);
    }
  }
  
  // Spawn golden cookies randomly
  if (p.random() < 0.002 && gameState.goldenCookies.length < 2) {
    const gc = new GoldenCookie(p);
    gameState.goldenCookies.push(gc);
  }
  
  // Update click animations
  for (let i = gameState.cookieClickAnimations.length - 1; i >= 0; i--) {
    gameState.cookieClickAnimations[i].update();
    if (gameState.cookieClickAnimations[i].isDead()) {
      gameState.cookieClickAnimations.splice(i, 1);
    }
  }
  
  // Check win condition
  if (gameState.cookies >= WIN_CONDITION) {
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", finalScore: gameState.totalCookiesEarned },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log player info periodically
  if (gameState.frameCounter % 60 === 0) {
    p.logs.player_info.push({
      screen_x: 150,
      screen_y: 220,
      game_x: 150,
      game_y: 220,
      framecount: p.frameCount
    });
  }
}