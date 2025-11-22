// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { resetGame, loadLevel } from './game.js';

let mouseStartX = null;
let mouseStartY = null;
let isDragging = false;

export function setupInputHandling(p) {
  p.keyPressed = function() {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // ENTER - Start game
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      gameState.currentLevel = 0;
      loadLevel(p, 0);
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.levelStartTime = Date.now();
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING, level: 0 },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    // ESC - Pause/Unpause
    if (p.keyCode === 27) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
    }

    // R - Restart
    if (p.keyCode === 82) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
        gameState.gamePhase = GAME_PHASES.START;
      }
    }

    // Z - Restart current level
    if (p.keyCode === 90 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      loadLevel(p, gameState.currentLevel);
      gameState.levelStartTime = Date.now();
    }

    // Space - Magic Finger
    if (p.keyCode === 32 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.candy && !gameState.magicFingerUsed) {
        gameState.candy.applyMagicFinger();
        p.logs.game_info.push({
          data: { event: "magic_finger_used" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    return false;
  };

  p.mousePressed = function() {
    mouseStartX = p.mouseX;
    mouseStartY = p.mouseY;
    isDragging = false;

    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Check air cushion clicks
      gameState.airCushions.forEach(cushion => {
        const dx = p.mouseX - cushion.x;
        const dy = p.mouseY - cushion.y;
        if (Math.abs(dx) < cushion.width/2 && Math.abs(dy) < cushion.height/2) {
          cushion.activate();
        }
      });

      // Check bubble clicks
      gameState.bubbles.forEach(bubble => {
        const dx = p.mouseX - (bubble.attached && gameState.candy ? gameState.candy.body.position.x : bubble.x);
        const dy = p.mouseY - (bubble.attached && gameState.candy ? gameState.candy.body.position.y - 30 : bubble.y);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bubble.radius) {
          bubble.pop();
        }
      });
    }
  };

  p.mouseDragged = function() {
    isDragging = true;
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Check if dragging over any rope
      gameState.ropes.forEach((rope, index) => {
        if (!rope.cut) {
          const posA = rope.constraint.bodyA 
            ? {
                x: rope.constraint.bodyA.position.x + rope.constraint.pointA.x,
                y: rope.constraint.bodyA.position.y + rope.constraint.pointA.y
              }
            : rope.constraint.pointA;
          
          const posB = rope.constraint.bodyB
            ? {
                x: rope.constraint.bodyB.position.x + rope.constraint.pointB.x,
                y: rope.constraint.bodyB.position.y + rope.constraint.pointB.y
              }
            : rope.constraint.pointB;

          // Check if mouse path intersects rope
          if (lineIntersectsLine(
            mouseStartX, mouseStartY, p.mouseX, p.mouseY,
            posA.x, posA.y, posB.x, posB.y,
            10 // tolerance
          )) {
            rope.cutRope();
            p.logs.game_info.push({
              data: { event: "rope_cut", ropeIndex: index },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          }
        }
      });
    }

    mouseStartX = p.mouseX;
    mouseStartY = p.mouseY;
  };
}

function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4, tolerance) {
  // Calculate distance from point to line segment
  const dist1 = pointToLineDistance(x1, y1, x3, y3, x4, y4);
  const dist2 = pointToLineDistance(x2, y2, x3, y3, x4, y4);
  
  return dist1 < tolerance || dist2 < tolerance;
}

function pointToLineDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}