// automated_testing_controller.js - Automated testing
import { gameState, PLAY_PHASES, GENRES, THEMES, SET_PIECES } from './globals.js';

function getTestWinAction(gameState) {
  // Optimal strategy to win: maximize quality and rating
  
  switch (gameState.playPhase) {
    case PLAY_PHASES.SELECT_GENRE:
      // Select best unlocked genre
      const unlockedGenres = GENRES.filter(g => g.unlocked);
      if (unlockedGenres.length > 0) {
        return { keyCode: 32 }; // Select current
      }
      break;
      
    case PLAY_PHASES.SELECT_THEME:
      // Find best synergy with selected genre
      const unlockedThemes = THEMES.filter(t => t.unlocked);
      if (unlockedThemes.length > 0) {
        // Try to find synergy
        let bestIndex = 0;
        let bestSynergy = 0;
        
        unlockedThemes.forEach((theme, idx) => {
          const synergyKey = `${gameState.currentProgram.genre}-${theme.id}`;
          const synergy = getSynergyValue(synergyKey);
          if (synergy > bestSynergy) {
            bestSynergy = synergy;
            bestIndex = idx;
          }
        });
        
        if (gameState.selectedThemeIndex < bestIndex) {
          return { keyCode: 40 }; // DOWN
        } else if (gameState.selectedThemeIndex > bestIndex) {
          return { keyCode: 38 }; // UP
        } else {
          return { keyCode: 32 }; // SELECT
        }
      }
      break;
      
    case PLAY_PHASES.SELECT_TALENT:
      // Hire best talent
      const availableTalent = gameState.availableTalent.filter(t => !t.hired);
      
      if (!gameState.currentProgram.host && availableTalent.length > 0) {
        // Find best host
        let bestIdx = 0;
        let bestSkill = 0;
        
        availableTalent.forEach((talent, idx) => {
          const skill = getTalentSkillForGenre(talent, gameState.currentProgram.genre);
          if (skill > bestSkill) {
            bestSkill = skill;
            bestIdx = idx;
          }
        });
        
        if (gameState.selectedTalentIndex < bestIdx) {
          return { keyCode: 40 }; // DOWN
        } else if (gameState.selectedTalentIndex > bestIdx) {
          return { keyCode: 38 }; // UP
        } else {
          return { keyCode: 32 }; // HIRE
        }
      } else if (gameState.currentProgram.guests.length < 2 && availableTalent.length > 0) {
        // Hire another guest
        return { keyCode: 32 };
      } else {
        // Move to studio design
        return { keyCode: 16 }; // SHIFT
      }
      break;
      
    case PLAY_PHASES.DESIGN_STUDIO:
      // Place set pieces strategically
      const totalPieces = gameState.currentProgram.setPieces.length;
      
      if (totalPieces < 8) { // Place up to 8 pieces
        // Find empty spot
        let foundEmpty = false;
        for (let y = 0; y < 6 && !foundEmpty; y++) {
          for (let x = 0; x < 8 && !foundEmpty; x++) {
            if (gameState.studioGrid[y][x] === null) {
              // Navigate to this spot
              if (gameState.cursorX < x) {
                return { keyCode: 39 }; // RIGHT
              } else if (gameState.cursorX > x) {
                return { keyCode: 37 }; // LEFT
              } else if (gameState.cursorY < y) {
                return { keyCode: 40 }; // DOWN
              } else if (gameState.cursorY > y) {
                return { keyCode: 38 }; // UP
              } else {
                return { keyCode: 32 }; // PLACE
              }
            }
          }
        }
      }
      
      // Start production
      return { keyCode: 16 }; // SHIFT
      
    case PLAY_PHASES.PRODUCING:
      // Wait for production to finish
      return null;
      
    case PLAY_PHASES.RESULTS:
      // Continue to next program
      return { keyCode: 32 };
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Simple navigation test
  
  switch (gameState.playPhase) {
    case PLAY_PHASES.SELECT_GENRE:
      return { keyCode: 32 }; // Select
      
    case PLAY_PHASES.SELECT_THEME:
      return { keyCode: 32 }; // Select
      
    case PLAY_PHASES.SELECT_TALENT:
      if (!gameState.currentProgram.host) {
        return { keyCode: 32 }; // Hire host
      } else {
        return { keyCode: 16 }; // Skip to design
      }
      
    case PLAY_PHASES.DESIGN_STUDIO:
      if (gameState.currentProgram.setPieces.length < 3) {
        return { keyCode: 32 }; // Place piece
      } else {
        return { keyCode: 16 }; // Start production
      }
      
    case PLAY_PHASES.RESULTS:
      return { keyCode: 32 }; // Continue
  }
  
  return null;
}

function getSynergyValue(synergyKey) {
  const synergies = {
    "talk-comedy": 1.5,
    "talk-food": 1.2,
    "variety-comedy": 1.4,
    "variety-action": 1.3,
    "drama-romance": 1.5,
    "drama-mystery": 1.4,
    "news-action": 1.2,
    "news-mystery": 1.3,
    "quiz-comedy": 1.3,
    "quiz-mystery": 1.4
  };
  return synergies[synergyKey] || 1.0;
}

function getTalentSkillForGenre(talent, genre) {
  if (!talent) return 0;
  
  switch (genre) {
    case "talk":
    case "news":
      return talent.talkSkill;
    case "variety":
    case "quiz":
      return talent.performSkill;
    case "drama":
      return talent.appealSkill;
    default:
      return Math.floor((talent.talkSkill + talent.performSkill + talent.appealSkill) / 3);
  }
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;