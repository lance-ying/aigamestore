// game.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { keys, handleKeyPressed, handleKeyReleased, processAutomatedInput } from './input_handler.js';
import { initializeGame, startClassTrial, completeChapter, handleGameOver, checkAllEvidenceCollected } from './game_logic.js';
import { TruthBullet } from './evidence.js';
import { drawStartScreen, drawInvestigationUI, drawClassTrialUI, drawPausedIndicator, drawGameOverScreen } from './ui.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let activeBullet = null;
  let bulletCooldown = 0;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    p.logs.game_info.push({
      data: { phase: "GAME_START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(30, 25, 40);
    
    // Process automated testing input
    if (gameState.controlMode !== "HUMAN" && 
        gameState.gamePhase !== GAME_PHASES.START &&
        gameState.gamePhase !== GAME_PHASES.GAME_OVER_WIN &&
        gameState.gamePhase !== GAME_PHASES.GAME_OVER_LOSE) {
      const action = get_automated_testing_action(gameState);
      processAutomatedInput(p, action);
    }
    
    // Game phase rendering and logic
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } 
    else if (gameState.gamePhase === GAME_PHASES.INVESTIGATION) {
      updateInvestigation(p);
      drawInvestigation(p);
    }
    else if (gameState.gamePhase === GAME_PHASES.CLASS_TRIAL) {
      updateClassTrial(p);
      drawClassTrial(p);
    }
    else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Draw the paused game state
      if (gameState.collectedBullets.length === gameState.evidencePoints.length) {
        drawClassTrial(p);
      } else {
        drawInvestigation(p);
      }
      drawPausedIndicator(p);
    }
    else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p, gameState);
    }
    
    // Log player info
    if (gameState.player && p.frameCount % 10 === 0) {
      const screenPos = gameState.player.getScreenPos();
      const gamePos = gameState.player.getGamePos();
      p.logs.player_info.push({
        screen_x: screenPos.screen_x,
        screen_y: screenPos.screen_y,
        game_x: gamePos.game_x,
        game_y: gamePos.game_y,
        framecount: p.frameCount
      });
    }
  };
  
  function updateInvestigation(p) {
    // Update player
    gameState.player.update(p, keys, gameState.gamePhase);
    
    // Update evidence points
    gameState.evidencePoints.forEach(evidence => {
      evidence.update(p);
      
      // Check collection
      if (keys[32] && evidence.checkCollection(gameState.player) && !evidence.collected) {
        evidence.collected = true;
        const bullet = new TruthBullet(evidence.id, evidence.name, evidence.description);
        gameState.collectedBullets.push(bullet);
        gameState.score += 100;
        
        p.logs.game_info.push({
          data: { event: "EVIDENCE_COLLECTED", id: evidence.id },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    });
    
    // Check if all evidence collected
    if (checkAllEvidenceCollected() && gameState.collectedBullets.length > 0) {
      startClassTrial(p);
      p.logs.game_info.push({
        data: { phase: "CLASS_TRIAL_START", chapter: gameState.currentChapter },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function drawInvestigation(p) {
    // Draw background
    p.fill(45, 40, 55);
    p.rect(0, 35, CANVAS_WIDTH, CANVAS_HEIGHT - 70);
    
    // Draw floor tiles
    p.stroke(60, 55, 70);
    p.strokeWeight(1);
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
      for (let y = 35; y < CANVAS_HEIGHT - 35; y += 50) {
        p.fill(40 + (x + y) % 20, 35 + (x + y) % 20, 50 + (x + y) % 20);
        p.rect(x, y, 50, 50);
      }
    }
    
    // Draw evidence points
    gameState.evidencePoints.forEach(evidence => evidence.draw(p));
    
    // Draw player
    gameState.player.draw(p);
    
    // Draw UI
    drawInvestigationUI(p, gameState);
  }
  
  function updateClassTrial(p) {
    // Update timer
    gameState.trialTimeRemaining -= 1 / 60;
    
    // Check time out
    if (gameState.trialTimeRemaining <= 0) {
      handleGameOver();
      return;
    }
    
    // Update slow-mo
    if (gameState.slowMoActive) {
      gameState.slowMoDuration -= 1 / 60;
      if (gameState.slowMoDuration <= 0) {
        gameState.slowMoActive = false;
      }
    }
    
    // Activate slow-mo
    if (keys[16] && gameState.slowMoCharges > 0 && !gameState.slowMoActive) {
      gameState.slowMoActive = true;
      gameState.slowMoDuration = 3;
      gameState.slowMoCharges--;
    }
    
    // Update statements
    gameState.trialStatements.forEach(statement => {
      statement.update(gameState.slowMoActive);
      
      // Check if off screen (missed lie)
      if (statement.isOffScreen() && statement.isLie && !statement.hit) {
        gameState.health--;
        gameState.combo = 0;
        
        if (gameState.health <= 0) {
          handleGameOver();
        }
      }
    });
    
    // Update active bullet
    if (activeBullet) {
      activeBullet.update();
      
      // Check collisions with statements
      gameState.trialStatements.forEach(statement => {
        if (statement.checkHit(activeBullet)) {
          statement.hit = true;
          activeBullet.active = false;
          
          if (statement.isLie) {
            // Correct hit on lie
            gameState.liesFound++;
            gameState.score += 200 + gameState.combo * 50;
            gameState.combo++;
            gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
            
            p.logs.game_info.push({
              data: { event: "LIE_EXPOSED", combo: gameState.combo },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
            
            // Check win condition
            if (gameState.liesFound >= gameState.totalLies) {
              completeChapter(p);
              p.logs.game_info.push({
                data: { event: "CHAPTER_COMPLETE", chapter: gameState.currentChapter - 1 },
                framecount: p.frameCount,
                timestamp: Date.now()
              });
            }
          } else {
            // Hit truth by mistake
            gameState.health--;
            gameState.combo = 0;
            
            if (gameState.health <= 0) {
              handleGameOver();
            }
          }
        }
      });
      
      if (!activeBullet.active) {
        activeBullet = null;
      }
    }
    
    // Fire bullet
    if (bulletCooldown > 0) {
      bulletCooldown--;
    }
    
    if (keys[90] && !activeBullet && bulletCooldown === 0 && gameState.collectedBullets.length > 0) {
      // Find closest lie statement
      let closestLie = null;
      let closestDist = Infinity;
      
      gameState.trialStatements.forEach(statement => {
        if (statement.isLie && !statement.hit && statement.x > 0 && statement.x < CANVAS_WIDTH) {
          const dist = Math.abs(statement.x - CANVAS_WIDTH / 2);
          if (dist < closestDist) {
            closestDist = dist;
            closestLie = statement;
          }
        }
      });
      
      if (closestLie) {
        activeBullet = new TruthBullet(0, "Evidence", "");
        activeBullet.fire(50, CANVAS_HEIGHT / 2, closestLie.x, closestLie.y);
        bulletCooldown = 20;
      }
    }
  }
  
  function drawClassTrial(p) {
    // Background
    p.fill(30, 25, 40);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Courtroom effect
    for (let i = 0; i < 5; i++) {
      p.stroke(50 + i * 10, 45 + i * 10, 60 + i * 10, 100);
      p.strokeWeight(3);
      p.line(0, 60 + i * 60, CANVAS_WIDTH, 60 + i * 60);
    }
    
    // Draw statements
    gameState.trialStatements.forEach(statement => statement.draw(p));
    
    // Draw active bullet
    if (activeBullet) {
      activeBullet.draw(p);
    }
    
    // Draw crosshair
    p.stroke(255, 200, 0);
    p.strokeWeight(2);
    p.noFill();
    p.ellipse(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 30, 30);
    p.line(CANVAS_WIDTH / 2 - 20, CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2 + 20, CANVAS_HEIGHT / 2);
    p.line(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    // Draw UI
    drawClassTrialUI(p, gameState);
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
});

window.gameInstance = gameInstance;

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Auto-start for test modes
  if (mode !== 'HUMAN' && gameState.gamePhase === 'START') {
    initializeGame(gameInstance);
  }
};