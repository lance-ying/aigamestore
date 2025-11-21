import { gameState, GAME_PHASES, PLAY_STATES, MINIGAME_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { InteractableObject } from './interactableObject.js';
import { DialogueManager } from './dialogue.js';
import { SpellTraceMiniGame, QTEMiniGame } from './minigames.js';
import { getChapterData, getLocationBackground } from './storyData.js';
import { renderUI, renderStartScreen, renderGameOver, renderLevelTransition, renderPauseOverlay } from './ui.js';
import { generateTestActions, executeTestAction } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let dialogueManager;
  let transitionTimer = 0;
  let miniGameResultTimer = 0;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize game
    initGame();
    
    logGameInfo("Game initialized");
  };
  
  function initGame() {
    gameState.player = new Player(CANVAS_WIDTH / 2, 350, 'GRYFFINDOR');
    dialogueManager = new DialogueManager();
    
    gameState.entities = [gameState.player];
    gameState.currentEnergy = gameState.maxEnergy;
    gameState.score = 0;
    gameState.currentYear = 1;
    gameState.currentChapter = 1;
    gameState.courageLevel = 1;
    gameState.empathyLevel = 1;
    gameState.knowledgeLevel = 1;
    gameState.completedChapters = [];
    gameState.gamePhase = GAME_PHASES.START;
    gameState.playState = PLAY_STATES.EXPLORATION;
    
    loadChapter(1, 1);
  }
  
  function loadChapter(year, chapter) {
    const chapterData = getChapterData(year, chapter);
    if (!chapterData) {
      // No more chapters, win condition
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      logGameInfo("All chapters complete - WIN");
      return;
    }
    
    gameState.activeTask = {
      title: chapterData.title,
      location: chapterData.location,
      taskEnergy: chapterData.taskEnergy,
      taskDescription: chapterData.taskDescription,
      dialogue: chapterData.dialogue,
      miniGame: chapterData.miniGame
    };
    
    gameState.taskProgressEnergySpent = 0;
    gameState.currentEnergy = gameState.maxEnergy; // Replenish energy
    
    // Create interactable objects
    gameState.interactableObjects = [];
    const numObjects = Math.ceil(chapterData.taskEnergy / 5);
    for (let i = 0; i < numObjects; i++) {
      const obj = new InteractableObject(
        100 + (i % 4) * 120,
        150 + Math.floor(i / 4) * 80,
        80, 60, 5,
        "Interactive Object"
      );
      gameState.interactableObjects.push(obj);
    }
    
    logGameInfo(`Loaded Year ${year} Chapter ${chapter}: ${chapterData.title}`);
  }
  
  p.draw = function() {
    p.background(30, 25, 45);
    
    // Handle testing mode
    if (gameState.controlMode !== 'HUMAN') {
      handleTestingMode();
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        renderPlayingState();
        break;
        
      case GAME_PHASES.PAUSED:
        renderPlayingState();
        renderPauseOverlay(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
        renderGameOver(p, true);
        break;
        
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p, false);
        break;
    }
  };
  
  function renderPlayingState() {
    // Draw background based on location
    if (gameState.activeTask) {
      const bgColor = getLocationBackground(gameState.activeTask.location);
      p.background(...bgColor);
    }
    
    // Draw based on play state
    switch (gameState.playState) {
      case PLAY_STATES.EXPLORATION:
        renderExploration();
        break;
        
      case PLAY_STATES.DIALOGUE:
        renderDialogue();
        break;
        
      case PLAY_STATES.MINIGAME:
        renderMiniGame();
        break;
        
      case PLAY_STATES.LEVEL_TRANSITION:
        renderLevelTransition(p);
        break;
    }
    
    renderUI(p);
  }
  
  function renderExploration() {
    // Draw location decoration
    drawLocationDecoration();
    
    // Draw interactable objects
    for (const obj of gameState.interactableObjects) {
      obj.update();
      obj.render(p);
    }
    
    // Draw player
    gameState.player.render(p);
    
    // Hover tooltip
    for (const obj of gameState.interactableObjects) {
      if (obj.active && obj.checkHover(p.mouseX, p.mouseY)) {
        p.push();
        p.fill(0, 0, 0, 200);
        p.noStroke();
        p.rect(p.mouseX - 40, p.mouseY - 35, 80, 25, 3);
        p.fill(255, 220, 100);
        p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Click to interact", p.mouseX, p.mouseY - 22);
        p.text(`(-5 Energy)`, p.mouseX, p.mouseY - 10);
        p.pop();
      }
    }
  }
  
  function drawLocationDecoration() {
    p.push();
    
    if (gameState.activeTask) {
      const location = gameState.activeTask.location;
      
      // Draw simple decorative elements based on location
      if (location === "Great Hall") {
        // Torches
        for (let i = 0; i < 4; i++) {
          drawTorch(100 + i * 133, 50);
        }
      } else if (location === "Potions Classroom") {
        // Cauldrons
        for (let i = 0; i < 3; i++) {
          drawCauldron(150 + i * 150, 100);
        }
      } else if (location === "Library") {
        // Bookshelves
        for (let i = 0; i < 5; i++) {
          drawBookshelf(50 + i * 110, 80);
        }
      }
    }
    
    p.pop();
  }
  
  function drawTorch(x, y) {
    p.push();
    p.fill(80, 60, 40);
    p.stroke(60, 40, 20);
    p.strokeWeight(2);
    p.rect(x - 5, y, 10, 40);
    
    const flicker = Math.sin(p.frameCount * 0.1 + x) * 0.2 + 0.8;
    p.fill(255, 150, 50, flicker * 255);
    p.noStroke();
    p.circle(x, y - 5, 15);
    p.fill(255, 200, 100, flicker * 200);
    p.circle(x, y - 8, 10);
    p.pop();
  }
  
  function drawCauldron(x, y) {
    p.push();
    p.fill(60, 60, 70);
    p.stroke(40, 40, 50);
    p.strokeWeight(2);
    p.arc(x, y, 40, 40, 0, p.PI);
    p.rect(x - 20, y, 40, 30);
    p.pop();
  }
  
  function drawBookshelf(x, y) {
    p.push();
    p.fill(100, 70, 40);
    p.stroke(70, 50, 30);
    p.strokeWeight(2);
    p.rect(x, y, 80, 100);
    
    // Books
    p.randomSeed(x);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        p.fill(p.random(100, 200), p.random(50, 150), p.random(50, 100));
        p.noStroke();
        p.rect(x + 5 + j * 15, y + 10 + i * 30, 12, 25);
      }
    }
    p.pop();
  }
  
  function renderDialogue() {
    // Draw background
    drawLocationDecoration();
    
    // Draw player
    gameState.player.render(p);
    
    // Draw dialogue
    if (gameState.currentDialogue) {
      dialogueManager.render(p, gameState);
    }
  }
  
  function renderMiniGame() {
    if (gameState.currentMiniGame) {
      gameState.currentMiniGame.update();
      gameState.currentMiniGame.render(p);
      
      // Check for completion
      if (gameState.currentMiniGame.completed && miniGameResultTimer === 0) {
        miniGameResultTimer = p.frameCount + 90; // 1.5 seconds
        gameState.score += 50;
        
        // Increase attribute based on year
        if (gameState.currentYear === 1) {
          gameState.courageLevel++;
        } else if (gameState.currentYear === 2) {
          gameState.empathyLevel++;
        } else {
          gameState.knowledgeLevel++;
        }
        
        logGameInfo("Mini-game completed successfully");
      } else if (gameState.currentMiniGame.failed && miniGameResultTimer === 0) {
        miniGameResultTimer = p.frameCount + 90;
        gameState.miniGameAttempts++;
        
        if (gameState.miniGameAttempts >= gameState.miniGameMaxAttempts) {
          gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
          logGameInfo("Failed mini-game too many times - GAME OVER");
          return;
        }
        
        logGameInfo("Mini-game failed");
      }
      
      if (miniGameResultTimer > 0 && p.frameCount >= miniGameResultTimer) {
        miniGameResultTimer = 0;
        
        if (gameState.currentMiniGame.completed) {
          // Complete chapter
          completeChapter();
        } else {
          // Retry mini-game
          startMiniGame();
        }
      }
    }
  }
  
  function completeChapter() {
    gameState.score += 100;
    const chapterKey = `${gameState.currentYear}-${gameState.currentChapter}`;
    gameState.completedChapters.push(chapterKey);
    
    logGameInfo(`Chapter ${gameState.currentChapter} of Year ${gameState.currentYear} completed`);
    
    // Check if year is complete
    const chaptersInYear = 3;
    if (gameState.currentChapter >= chaptersInYear) {
      // Year complete
      if (gameState.currentYear >= 3) {
        // Game won!
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        logGameInfo("All years completed - VICTORY!");
      } else {
        // Transition to next year
        gameState.score += 500; // Year completion bonus
        gameState.currentYear++;
        gameState.currentChapter = 1;
        gameState.playState = PLAY_STATES.LEVEL_TRANSITION;
        transitionTimer = p.frameCount + 180; // 3 seconds
        logGameInfo(`Year ${gameState.currentYear - 1} completed, transitioning to Year ${gameState.currentYear}`);
      }
    } else {
      // Next chapter
      gameState.currentChapter++;
      loadChapter(gameState.currentYear, gameState.currentChapter);
      gameState.playState = PLAY_STATES.EXPLORATION;
    }
  }
  
  function startDialogue() {
    if (gameState.activeTask && gameState.activeTask.dialogue) {
      gameState.playState = PLAY_STATES.DIALOGUE;
      dialogueManager.startDialogue(gameState.activeTask.dialogue);
      gameState.currentDialogue = gameState.activeTask.dialogue;
      logGameInfo("Dialogue started");
    }
  }
  
  function startMiniGame() {
    if (gameState.activeTask && gameState.activeTask.miniGame) {
      gameState.playState = PLAY_STATES.MINIGAME;
      const mgData = gameState.activeTask.miniGame;
      
      if (mgData.type === "SPELL_TRACE") {
        gameState.currentMiniGame = new SpellTraceMiniGame(mgData.pattern, mgData.difficulty);
      } else if (mgData.type === "QTE") {
        gameState.currentMiniGame = new QTEMiniGame(mgData.difficulty);
      }
      
      logGameInfo(`Mini-game started: ${mgData.type}`);
    }
  }
  
  p.keyPressed = function() {
    logInput("keyPressed", { key: p.key, keyCode: p.keyCode });
    
    // Global controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        gameState.playState = PLAY_STATES.EXPLORATION;
        logGameInfo("Game started");
      }
      return;
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        logGameInfo("Game paused");
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logGameInfo("Game resumed");
      }
      return;
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
          gameState.gamePhase === GAME_PHASES.PAUSED) {
        initGame();
        logGameInfo("Game restarted");
      }
      return;
    }
    
    // Playing state controls
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    if (gameState.playState === PLAY_STATES.DIALOGUE) {
      handleDialogueInput();
    } else if (gameState.playState === PLAY_STATES.MINIGAME) {
      handleMiniGameInput();
    } else if (gameState.playState === PLAY_STATES.LEVEL_TRANSITION) {
      if (p.keyCode === 32) { // SPACE
        loadChapter(gameState.currentYear, gameState.currentChapter);
        gameState.playState = PLAY_STATES.EXPLORATION;
      }
    }
  };
  
  function handleDialogueInput() {
    if (p.keyCode === 38) { // UP
      if (gameState.currentDialogue && gameState.currentDialogue.options.length > 0) {
        dialogueManager.selectedOption = Math.max(0, dialogueManager.selectedOption - 1);
      }
    } else if (p.keyCode === 40) { // DOWN
      if (gameState.currentDialogue && gameState.currentDialogue.options.length > 0) {
        dialogueManager.selectedOption = Math.min(
          gameState.currentDialogue.options.length - 1,
          dialogueManager.selectedOption + 1
        );
      }
    } else if (p.keyCode === 32) { // SPACE
      if (gameState.currentDialogue && gameState.currentDialogue.options.length > 0) {
        // Select option
        const nextNode = dialogueManager.selectOption(dialogueManager.selectedOption, gameState);
        if (nextNode) {
          dialogueManager.startDialogue(nextNode);
          gameState.currentDialogue = nextNode;
        }
      } else {
        // Advance dialogue
        const complete = dialogueManager.advance();
        if (complete) {
          // Start mini-game
          startMiniGame();
        }
      }
    }
  }
  
  function handleMiniGameInput() {
    if (!gameState.currentMiniGame) return;
    
    if (gameState.currentMiniGame instanceof SpellTraceMiniGame) {
      if (p.key === 'w' || p.key === 'W') {
        gameState.currentMiniGame.handleInput('W');
      } else if (p.key === 'a' || p.key === 'A') {
        gameState.currentMiniGame.handleInput('A');
      } else if (p.key === 's' || p.key === 'S') {
        gameState.currentMiniGame.handleInput('S');
      } else if (p.key === 'd' || p.key === 'D') {
        gameState.currentMiniGame.handleInput('D');
      }
    } else if (gameState.currentMiniGame instanceof QTEMiniGame) {
      gameState.currentMiniGame.handleInput(p.key);
    }
  }
  
  p.mousePressed = function() {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    if (gameState.playState !== PLAY_STATES.EXPLORATION) return;
    
    // Check for object interaction
    for (const obj of gameState.interactableObjects) {
      if (obj.active && obj.checkHover(p.mouseX, p.mouseY)) {
        const energyCost = obj.interact();
        
        if (gameState.currentEnergy >= energyCost) {
          gameState.currentEnergy -= energyCost;
          gameState.taskProgressEnergySpent += energyCost;
          gameState.score += 10;
          obj.active = false;
          
          logInput("mousePressed", { x: p.mouseX, y: p.mouseY, object: "interactable" });
          logPlayerInfo();
          
          // Check if task is complete
          if (gameState.taskProgressEnergySpent >= gameState.activeTask.taskEnergy) {
            startDialogue();
          }
        }
        
        break;
      }
    }
  };
  
  function handleTestingMode() {
    if (gameState.testingActions.length === 0) {
      gameState.testingActions = generateTestActions(gameState.controlMode);
      gameState.testingIndex = 0;
    }
    
    // Execute actions for current frame
    while (gameState.testingIndex < gameState.testingActions.length) {
      const action = gameState.testingActions[gameState.testingIndex];
      if (action.frame > p.frameCount) break;
      
      executeTestAction(p, action);
      gameState.testingIndex++;
    }
  }
  
  function logGameInfo(data) {
    p.logs.game_info.push({
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logInput(inputType, data) {
    p.logs.inputs.push({
      input_type: inputType,
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logPlayerInfo() {
    if (gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }
});

// Expose game instance and state
window.gameInstance = gameInstance;
window.getGameState = function() {
  return gameState;
};

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  gameState.testingActions = [];
  gameState.testingIndex = 0;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + '_ModeBtn'}`);
  if (activeBtn) activeBtn.classList.add('active');
  
  console.log(`Control mode set to: ${mode}`);
};