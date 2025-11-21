// input.js - Input handling

import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  SUBPHASE_OVERWORLD,
  SUBPHASE_BATTLE,
  SUBPHASE_DIALOGUE,
  BATTLE_MENU,
  BATTLE_ANIMATING,
  BATTLE_ENEMY_TURN
} from './globals.js';
import { executeBattleAction } from './battle.js';

export function handleKeyPressed(p, key, keyCode, world) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13 && gameState.gamePhase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    gameState.subPhase = SUBPHASE_OVERWORLD;
    
    p.logs.game_info.push({
      data: { event: "GAME_START", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27 && (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED)) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
    } else {
      gameState.gamePhase = PHASE_PLAYING;
    }
    
    p.logs.game_info.push({
      data: { event: "PAUSE_TOGGLE", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // R - Restart
  if (keyCode === 82 && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    gameState.gamePhase = PHASE_START;
    
    p.logs.game_info.push({
      data: { event: "RESTART", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Gameplay inputs
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (gameState.subPhase === SUBPHASE_DIALOGUE) {
      handleDialogueInput(p, keyCode);
    } else if (gameState.subPhase === SUBPHASE_BATTLE) {
      handleBattleInput(p, keyCode);
    } else if (gameState.subPhase === SUBPHASE_OVERWORLD) {
      handleOverworldInput(p, keyCode, world);
    }
  }
}

function handleOverworldInput(p, keyCode, world) {
  const player = gameState.player;
  if (!player) return;
  
  // Z key - Interact
  if (keyCode === 90) {
    checkInteraction(p, world);
    return;
  }
}

function handleDialogueInput(p, keyCode) {
  // Z key - Advance dialogue
  if (keyCode === 90) {
    gameState.dialogueIndex++;
    
    if (gameState.dialogueIndex >= gameState.dialogue.length) {
      // End dialogue
      const npc = gameState.currentNPC;
      
      if (npc) {
        npc.interacted = true;
        
        // Handle NPC type
        if (npc.type === "TRAINER" && !npc.defeated) {
          // Start battle
          const { initBattle } = require('./battle.js');
          initBattle(p, npc.creoTeam[0], false, npc);
        } else if (npc.type === "HEALER") {
          // Heal team
          for (let creo of gameState.playerTeam) {
            creo.heal(creo.maxHp);
          }
        } else if (npc.type === "STORY") {
          // Progress story
          if (npc.missionId !== null && npc.missionId === gameState.storyProgress) {
            gameState.storyProgress++;
            gameState.completedMissions++;
            
            // Check win condition
            if (gameState.storyProgress >= 2 && gameState.trainersDefeated >= 4) {
              // Find boss NPC
              const bossNPC = world.npcs.find(n => n.type === "TRAINER" && 
                                                    n.creoTeam && 
                                                    n.creoTeam[0] && 
                                                    n.creoTeam[0].speciesId === "INFERNOX");
              if (bossNPC && bossNPC.defeated) {
                setTimeout(() => {
                  gameState.gamePhase = PHASE_GAME_OVER_WIN;
                }, 1000);
              }
            }
          }
        }
      }
      
      gameState.subPhase = SUBPHASE_OVERWORLD;
      gameState.dialogue = null;
      gameState.currentNPC = null;
    }
  }
}

function handleBattleInput(p, keyCode) {
  if (gameState.battleState !== BATTLE_MENU) return;
  
  const mainMenu = gameState.battleMenu.mainMenu;
  
  // Arrow keys - Navigate menu
  if (keyCode === 38) { // Up
    if (mainMenu === 0) {
      // In main menu
      gameState.battleMenu.mainMenu = Math.max(0, gameState.battleMenu.mainMenu - 1);
    } else if (mainMenu === 1) {
      // In skills menu
      gameState.battleMenu.skillMenu = Math.max(0, gameState.battleMenu.skillMenu - 1);
    } else if (mainMenu === 3) {
      // In switch menu
      gameState.battleMenu.switchMenu = Math.max(0, gameState.battleMenu.switchMenu - 1);
    }
  }
  else if (keyCode === 40) { // Down
    if (mainMenu < 4) {
      // In main menu
      gameState.battleMenu.mainMenu = Math.min(3, gameState.battleMenu.mainMenu + 1);
    } else if (mainMenu === 1) {
      // In skills menu
      const maxSkills = gameState.playerCreo ? gameState.playerCreo.skills.length - 1 : 0;
      gameState.battleMenu.skillMenu = Math.min(maxSkills, gameState.battleMenu.skillMenu + 1);
    } else if (mainMenu === 3) {
      // In switch menu
      const aliveCreo = gameState.playerTeam.filter(c => c.isAlive());
      gameState.battleMenu.switchMenu = Math.min(aliveCreo.length - 1, gameState.battleMenu.switchMenu + 1);
    }
  }
  
  // Z key - Confirm
  if (keyCode === 90) {
    if (mainMenu === 0) {
      // Attack with first skill
      executeBattleAction(p, { type: "ATTACK", skillIndex: 0 });
    }
    else if (mainMenu === 1) {
      // Use selected skill
      executeBattleAction(p, { type: "ATTACK", skillIndex: gameState.battleMenu.skillMenu });
      gameState.battleMenu.mainMenu = 0; // Return to main menu
    }
    else if (mainMenu === 2) {
      // Use capture item
      executeBattleAction(p, { type: "CAPTURE" });
      gameState.battleMenu.mainMenu = 0;
    }
    else if (mainMenu === 3) {
      // Switch Creo
      const aliveCreo = gameState.playerTeam.filter(c => c.isAlive());
      const selectedCreo = aliveCreo[gameState.battleMenu.switchMenu];
      const creoIndex = gameState.playerTeam.indexOf(selectedCreo);
      executeBattleAction(p, { type: "SWITCH", creoIndex });
      gameState.battleMenu.mainMenu = 0;
    }
  }
  
  // Space - Back
  if (keyCode === 32) {
    if (mainMenu > 0 && mainMenu < 4) {
      gameState.battleMenu.mainMenu = 0;
    }
  }
}

function checkInteraction(p, world) {
  const player = gameState.player;
  if (!player) return;
  
  // Check for nearby NPCs
  for (let npc of world.npcs) {
    const dx = (npc.x + npc.width / 2) - (player.x + player.width / 2);
    const dy = (npc.y + npc.height / 2) - (player.y + player.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 50 && npc.canInteract()) {
      // Start dialogue
      gameState.subPhase = SUBPHASE_DIALOGUE;
      gameState.dialogue = npc.dialogue;
      gameState.dialogueIndex = 0;
      gameState.currentNPC = npc;
      return;
    }
  }
}

export function updatePlayerMovement(p, world) {
  if (gameState.gamePhase !== PHASE_PLAYING || 
      gameState.subPhase !== SUBPHASE_OVERWORLD ||
      gameState.controlMode !== "HUMAN") {
    return;
  }
  
  const player = gameState.player;
  if (!player) return;
  
  let dx = 0;
  let dy = 0;
  
  if (p.keyIsDown(37)) dx = -player.speed; // Left
  if (p.keyIsDown(39)) dx = player.speed;  // Right
  if (p.keyIsDown(38)) dy = -player.speed; // Up
  if (p.keyIsDown(40)) dy = player.speed;  // Down
  
  if (dx !== 0 || dy !== 0) {
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    if (world.isWalkable(newX, newY, player.width, player.height)) {
      player.move(dx, dy, world.width, world.height);
      
      // Random encounter check
      if (world.checkRandomEncounter(p)) {
        triggerWildEncounter(p);
      }
    }
  } else {
    player.stopMoving();
  }
}

function triggerWildEncounter(p) {
  const { Creo } = require('./creo.js');
  const { initBattle } = require('./battle.js');
  
  // Random wild Creo
  const wildSpecies = ["SPARKBIT", "ROCKLING", "LEAFLING", "AQUATAIL", "FLAMEPUP"];
  const randomSpecies = wildSpecies[Math.floor(Math.random() * wildSpecies.length)];
  const level = 5 + Math.floor(Math.random() * 3);
  
  const wildCreo = new Creo(randomSpecies, level);
  initBattle(p, wildCreo, true, null);
}

export function processAutomatedTestingInput(p, world) {
  if (gameState.controlMode === "HUMAN") return;
  
  const action = window.get_automated_testing_action(gameState);
  if (!action) return;
  
  // Process action
  if (action.keyCode) {
    handleKeyPressed(p, action.key, action.keyCode, world);
  }
  
  // Movement for automated testing
  if (gameState.subPhase === SUBPHASE_OVERWORLD) {
    const player = gameState.player;
    if (!player) return;
    
    if (action.move) {
      const { dx, dy } = action.move;
      const newX = player.x + dx * player.speed;
      const newY = player.y + dy * player.speed;
      
      if (world.isWalkable(newX, newY, player.width, player.height)) {
        player.move(dx * player.speed, dy * player.speed, world.width, world.height);
        
        // Check encounter
        if (world.checkRandomEncounter(p)) {
          triggerWildEncounter(p);
        }
      }
    } else {
      player.stopMoving();
    }
  }
}