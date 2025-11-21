// narrative.js
import { gameState, ALIEN_WORDS } from './globals.js';

export class NarrativeEngine {
  constructor() {
    this.storyEvents = [];
    this.currentEventIndex = 0;
  }
  
  // Get character's dialogue based on day, player's dictionary, and context
  getCharacterDialogue(context = "greeting") {
    const day = gameState.currentDay;
    const dict = gameState.playerDictionary;
    
    // Build dialogue using alien words
    const dialogues = {
      day1_greeting: `${ALIEN_WORDS.friend.alien}? ${ALIEN_WORDS.help.alien} ${ALIEN_WORDS.want.alien}?`,
      day2_morning: `${ALIEN_WORDS.today.alien} ${ALIEN_WORDS.food.alien} ${ALIEN_WORDS.want.alien}?`,
      day3_concern: `${ALIEN_WORDS.danger.alien}! ${ALIEN_WORDS.door.alien} ${ALIEN_WORDS.escape.alien}?`,
      day4_trust: `${ALIEN_WORDS.trust.alien} ${ALIEN_WORDS.want.alien}... ${ALIEN_WORDS.afraid.alien}`,
      day5_decision: `${ALIEN_WORDS.tomorrow.alien} ${ALIEN_WORDS.go.alien}. ${ALIEN_WORDS.help.alien}?`,
      day6_urgency: `${ALIEN_WORDS.night.alien}! ${ALIEN_WORDS.escape.alien} ${ALIEN_WORDS.want.alien}!`,
      day7_finale: `${ALIEN_WORDS.friend.alien}... ${ALIEN_WORDS.give.alien} ${ALIEN_WORDS.help.alien}?`
    };
    
    // Select dialogue based on day and context
    if (day === 1) return dialogues.day1_greeting;
    if (day === 2) return dialogues.day2_morning;
    if (day === 3) return dialogues.day3_concern;
    if (day === 4) return dialogues.day4_trust;
    if (day === 5) return dialogues.day5_decision;
    if (day === 6) return dialogues.day6_urgency;
    if (day === 7) return dialogues.day7_finale;
    
    return `${ALIEN_WORDS.friend.alien}...`;
  }
  
  // Determine character mood based on player's interpretations
  determineCharacterMood() {
    const dict = gameState.playerDictionary;
    
    // Analyze key words in dictionary
    const escapeWord = dict[ALIEN_WORDS.escape.alien] || "";
    const trustWord = dict[ALIEN_WORDS.trust.alien] || "";
    const friendWord = dict[ALIEN_WORDS.friend.alien] || "";
    const dangerWord = dict[ALIEN_WORDS.danger.alien] || "";
    
    // Positive interpretations
    const positiveWords = ["help", "friend", "trust", "yes", "good", "safe"];
    const negativeWords = ["no", "lie", "bad", "enemy", "danger", "evil"];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    for (let word of positiveWords) {
      if (escapeWord.toLowerCase().includes(word)) positiveScore++;
      if (trustWord.toLowerCase().includes(word)) positiveScore++;
      if (friendWord.toLowerCase().includes(word)) positiveScore++;
    }
    
    for (let word of negativeWords) {
      if (escapeWord.toLowerCase().includes(word)) negativeScore++;
      if (trustWord.toLowerCase().includes(word)) negativeScore++;
      if (friendWord.toLowerCase().includes(word)) negativeScore++;
    }
    
    if (positiveScore > negativeScore + 1) return "happy";
    if (negativeScore > positiveScore + 1) return "sad";
    if (gameState.currentDay >= 5) return "afraid";
    
    return "neutral";
  }
  
  // Get the ending based on player's dictionary interpretations
  getEnding() {
    const dict = gameState.playerDictionary;
    
    // Count word categories
    let trustCount = 0;
    let escapeCount = 0;
    let helpCount = 0;
    
    const positiveWords = ["help", "friend", "trust", "yes", "good", "safe", "escape", "free"];
    const negativeWords = ["no", "lie", "bad", "enemy", "danger", "stay", "trap"];
    
    // Analyze all dictionary entries
    for (let alienWord in dict) {
      const translation = dict[alienWord].toLowerCase();
      
      for (let posWord of positiveWords) {
        if (translation.includes(posWord)) {
          if (posWord === "escape" || posWord === "free") escapeCount++;
          if (posWord === "help" || posWord === "friend") helpCount++;
          if (posWord === "trust") trustCount++;
        }
      }
    }
    
    // Determine ending type
    if (escapeCount >= 2 && trustCount >= 1) {
      return {
        type: "ESCAPE_TOGETHER",
        title: "Freedom Together",
        message: "Understanding bridged the gap between worlds. Together, you both escaped into a new beginning.",
        mood: "happy"
      };
    } else if (helpCount >= 2 && trustCount >= 1) {
      return {
        type: "FRIENDSHIP",
        title: "Bonds Beyond Words",
        message: "Language was just the beginning. You formed a connection that transcended words.",
        mood: "happy"
      };
    } else if (escapeCount === 0 && trustCount === 0) {
      return {
        type: "MISUNDERSTANDING",
        title: "Lost in Translation",
        message: "The language barrier proved too great. You both remain trapped by misunderstanding.",
        mood: "sad"
      };
    } else if (escapeCount >= 1) {
      return {
        type: "SOLO_ESCAPE",
        title: "Alone in Freedom",
        message: "You understood enough to escape, but left your companion behind. Freedom tastes bittersweet.",
        mood: "confused"
      };
    } else {
      return {
        type: "UNCERTAIN",
        title: "Seven Days Later",
        message: "Seven days have passed. Some understanding was reached, but the story remains unfinished.",
        mood: "neutral"
      };
    }
  }
  
  // Advance time and trigger day transitions
  advanceTime() {
    const times = ["morning", "afternoon", "evening", "night"];
    const currentIndex = times.indexOf(gameState.timeOfDay);
    
    if (currentIndex < times.length - 1) {
      gameState.timeOfDay = times[currentIndex + 1];
    } else {
      // Move to next day
      gameState.timeOfDay = "morning";
      gameState.currentDay++;
      
      // Check for game end
      if (gameState.currentDay > 7) {
        return true; // Signal game end
      }
    }
    
    return false;
  }
}