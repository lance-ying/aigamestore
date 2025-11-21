import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { TruthBullet, Statement, FiredBullet, VisualEffect, Player } from './entities.js';

export function initializeGame(p) {
  // Reset game state
  gameState.influencePoints = gameState.maxInfluencePoints;
  gameState.truthBullets = [];
  gameState.selectedBulletIndex = 0;
  gameState.statements = [];
  gameState.contradictionsExposed = 0;
  gameState.requiredContradictions = 5;
  gameState.statementSpeed = 1.0;
  gameState.trialPhase = 1;
  gameState.firedBullets = [];
  gameState.effects = [];
  gameState.score = 0;
  gameState.lastShotTime = 0;
  gameState.frameCount = 0;
  gameState.gameStartTime = Date.now();
  
  // Initialize player
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  gameState.entities = [gameState.player];
  
  // Initialize starting Truth Bullets
  gameState.truthBullets = [
    new TruthBullet("Bloody Knife", "weapon", "A knife found at the scene"),
    new TruthBullet("Time of Death", "time", "Victim died at 10:30 PM"),
    new TruthBullet("Broken Alibi", "alibi", "Witness was not where they claimed")
  ];
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: "PLAYING", message: "Game Started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  p.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: gameState.player.x,
    game_y: gameState.player.y,
    framecount: p.frameCount
  });
}

export function spawnStatement(p) {
  const speakers = ["Makoto", "Kyoko", "Byakuya", "Sayaka", "Toko"];
  const weakPointTypes = ["weapon", "alibi", "location", "time", "evidence"];
  
  const statements = [
    { text: "I was in my room all night", weak: "alibi" },
    { text: "The murder weapon was never found", weak: "weapon" },
    { text: "Nobody could have entered the crime scene", weak: "location" },
    { text: "The victim was alive at midnight", weak: "time" },
    { text: "There's no evidence against anyone", weak: "evidence" },
    { text: "I heard nothing suspicious", weak: null },
    { text: "Everyone was accounted for", weak: "alibi" },
    { text: "The door was locked from inside", weak: "location" },
    { text: "I saw the victim earlier that evening", weak: null },
    { text: "The weapon could be anything", weak: "weapon" }
  ];
  
  const randomStatement = statements[Math.floor(p.random() * statements.length)];
  const hasWeakPoint = randomStatement.weak !== null;
  const y = 80 + Math.floor(p.random() * 3) * 60;
  const speed = gameState.statementSpeed * (0.8 + p.random() * 0.4);
  
  const statement = new Statement(
    randomStatement.text,
    speakers[Math.floor(p.random() * speakers.length)],
    randomStatement.weak || weakPointTypes[Math.floor(p.random() * weakPointTypes.length)],
    y,
    speed,
    hasWeakPoint
  );
  
  gameState.statements.push(statement);
}

export function updateGame(p) {
  gameState.frameCount++;
  
  // Spawn statements periodically
  if (gameState.frameCount % 90 === 0) {
    spawnStatement(p);
  }
  
  // Update statements
  for (let i = gameState.statements.length - 1; i >= 0; i--) {
    const stmt = gameState.statements[i];
    stmt.update();
    
    if (stmt.isOffScreen()) {
      // If weak point statement goes off screen without being exposed, lose influence
      if (stmt.hasWeakPoint && !stmt.exposed) {
        gameState.influencePoints--;
        gameState.effects.push(new VisualEffect(CANVAS_WIDTH - 100, stmt.y, 'damage', { text: "MISSED!" }));
        
        if (gameState.influencePoints <= 0) {
          gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
          p.logs.game_info.push({
            data: { phase: "GAME_OVER_LOSE", message: "Influence Depleted" },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      gameState.statements.splice(i, 1);
    }
  }
  
  // Update fired bullets
  for (let i = gameState.firedBullets.length - 1; i >= 0; i--) {
    const bullet = gameState.firedBullets[i];
    bullet.update();
    
    if (!bullet.active) {
      // Check collision with statements
      let hit = false;
      for (const stmt of gameState.statements) {
        if (stmt.exposed || !stmt.hasWeakPoint) continue;
        
        const wpX = stmt.getWeakPointX();
        const wpY = stmt.getWeakPointY();
        const dist = Math.sqrt((bullet.x - wpX) ** 2 + (bullet.y - wpY) ** 2);
        
        if (dist < 40) {
          // Check if correct bullet type
          if (bullet.bulletData.type === stmt.weakPointType) {
            // Correct hit!
            stmt.exposed = true;
            gameState.contradictionsExposed++;
            gameState.score += 100;
            gameState.effects.push(new VisualEffect(wpX, wpY, 'expose', { text: "BREAK!" }));
            hit = true;
            
            // Check win condition
            if (gameState.contradictionsExposed >= gameState.requiredContradictions) {
              gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
              p.logs.game_info.push({
                data: { phase: "GAME_OVER_WIN", message: "All Contradictions Exposed", score: gameState.score },
                framecount: p.frameCount,
                timestamp: Date.now()
              });
            }
            break;
          } else {
            // Wrong bullet type
            gameState.influencePoints--;
            gameState.effects.push(new VisualEffect(wpX, wpY, 'miss', { text: "WRONG!" }));
            hit = true;
            
            if (gameState.influencePoints <= 0) {
              gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
              p.logs.game_info.push({
                data: { phase: "GAME_OVER_LOSE", message: "Influence Depleted" },
                framecount: p.frameCount,
                timestamp: Date.now()
              });
            }
            break;
          }
        }
      }
      
      if (!hit) {
        gameState.effects.push(new VisualEffect(bullet.x, bullet.y, 'miss', { text: "MISS" }));
      }
      
      gameState.firedBullets.splice(i, 1);
    }
  }
  
  // Update effects
  for (let i = gameState.effects.length - 1; i >= 0; i--) {
    gameState.effects[i].update();
    if (gameState.effects[i].isFinished()) {
      gameState.effects.splice(i, 1);
    }
  }
  
  // Increase difficulty over time
  if (gameState.contradictionsExposed === 2 && gameState.trialPhase === 1) {
    gameState.trialPhase = 2;
    gameState.statementSpeed = 1.3;
  } else if (gameState.contradictionsExposed === 4 && gameState.trialPhase === 2) {
    gameState.trialPhase = 3;
    gameState.statementSpeed = 1.6;
  }
}

export function handlePlayerInput(p, keyCode) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const currentTime = Date.now();
  
  // Arrow keys to select bullet
  if (keyCode === 37) { // LEFT
    if (gameState.truthBullets.length > 0) {
      gameState.selectedBulletIndex = (gameState.selectedBulletIndex - 1 + gameState.truthBullets.length) % gameState.truthBullets.length;
    }
  } else if (keyCode === 39) { // RIGHT
    if (gameState.truthBullets.length > 0) {
      gameState.selectedBulletIndex = (gameState.selectedBulletIndex + 1) % gameState.truthBullets.length;
    }
  } else if (keyCode === 32) { // SPACE - fire bullet
    if (gameState.truthBullets.length > 0 && currentTime - gameState.lastShotTime > gameState.shotCooldown) {
      fireBullet(p);
      gameState.lastShotTime = currentTime;
    }
  } else if (keyCode === 90) { // Z - absorb statement
    absorbStatement(p);
  }
}

function fireBullet(p) {
  if (gameState.truthBullets.length === 0) return;
  
  const selectedBullet = gameState.truthBullets[gameState.selectedBulletIndex];
  
  // Find nearest weak point
  let nearestStmt = null;
  let nearestDist = Infinity;
  
  for (const stmt of gameState.statements) {
    if (!stmt.hasWeakPoint || stmt.exposed) continue;
    
    const wpX = stmt.getWeakPointX();
    const wpY = stmt.getWeakPointY();
    
    // Only target statements in front half of screen
    if (wpX < CANVAS_WIDTH / 2 || wpX > CANVAS_WIDTH) continue;
    
    const dist = Math.sqrt((gameState.player.x - wpX) ** 2 + (gameState.player.y - wpY) ** 2);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestStmt = stmt;
    }
  }
  
  let targetX = gameState.player.x;
  let targetY = 100;
  
  if (nearestStmt) {
    targetX = nearestStmt.getWeakPointX();
    targetY = nearestStmt.getWeakPointY();
  }
  
  const bullet = new FiredBullet(
    gameState.player.x,
    gameState.player.y,
    targetX,
    targetY,
    selectedBullet
  );
  
  gameState.firedBullets.push(bullet);
}

function absorbStatement(p) {
  // Find nearest absorbable statement
  for (const stmt of gameState.statements) {
    if (!stmt.absorbable || stmt.exposed) continue;
    
    const stmtX = stmt.x + 150;
    if (stmtX > 100 && stmtX < CANVAS_WIDTH - 100) {
      // Absorb it
      const newBullet = new TruthBullet(
        stmt.text.substring(0, 20),
        stmt.weakPointType,
        "Absorbed statement"
      );
      gameState.truthBullets.push(newBullet);
      stmt.exposed = true;
      gameState.effects.push(new VisualEffect(stmtX, stmt.y, 'hit', { text: "ABSORBED!" }));
      gameState.score += 50;
      break;
    }
  }
}