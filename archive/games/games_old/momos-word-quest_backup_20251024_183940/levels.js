// levels.js - Level configurations and vocabulary data

import { MINI_GAME_TYPES } from './globals.js';

export const LEVELS = [
  {
    levelNumber: 1,
    name: "Basic Nouns",
    subtitle: "Image to Word",
    miniGameType: MINI_GAME_TYPES.IMAGE_TO_WORD,
    totalQuestions: 8,
    timePerQuestion: 15,
    requiredCorrect: 6,
    vocabulary: [
      { word: "apple", correctAnswer: "apple", options: ["apple", "banana", "orange", "grape"] },
      { word: "cat", correctAnswer: "cat", options: ["cat", "dog", "bird", "fish"] },
      { word: "house", correctAnswer: "house", options: ["house", "car", "tree", "boat"] },
      { word: "tree", correctAnswer: "tree", options: ["tree", "flower", "grass", "bush"] },
      { word: "car", correctAnswer: "car", options: ["car", "truck", "bike", "bus"] },
      { word: "sun", correctAnswer: "sun", options: ["sun", "moon", "star", "cloud"] },
      { word: "book", correctAnswer: "book", options: ["book", "pen", "paper", "desk"] },
      { word: "ball", correctAnswer: "ball", options: ["ball", "cube", "cone", "ring"] }
    ]
  },
  {
    levelNumber: 2,
    name: "Basic Verbs",
    subtitle: "Choose Definition",
    miniGameType: MINI_GAME_TYPES.WORD_TO_DEFINITION,
    totalQuestions: 10,
    timePerQuestion: 12,
    requiredCorrect: 7,
    vocabulary: [
      { word: "run", correctAnswer: "to move fast on foot", options: ["to move fast on foot", "to sit down", "to eat food", "to sleep well"] },
      { word: "jump", correctAnswer: "to push off ground", options: ["to push off ground", "to fall down", "to stand still", "to crawl slowly"] },
      { word: "eat", correctAnswer: "to consume food", options: ["to consume food", "to drink water", "to breathe air", "to see things"] },
      { word: "sleep", correctAnswer: "to rest with eyes closed", options: ["to rest with eyes closed", "to stay awake", "to work hard", "to play games"] },
      { word: "read", correctAnswer: "to look at words", options: ["to look at words", "to listen to music", "to watch videos", "to draw pictures"] },
      { word: "write", correctAnswer: "to make words on paper", options: ["to make words on paper", "to erase marks", "to fold paper", "to cut paper"] },
      { word: "swim", correctAnswer: "to move through water", options: ["to move through water", "to climb a tree", "to fly in air", "to dig a hole"] },
      { word: "sing", correctAnswer: "to make music with voice", options: ["to make music with voice", "to whisper quietly", "to shout loudly", "to laugh happily"] },
      { word: "dance", correctAnswer: "to move to music", options: ["to move to music", "to stand frozen", "to walk slowly", "to sit down"] },
      { word: "think", correctAnswer: "to use your mind", options: ["to use your mind", "to close eyes", "to touch objects", "to smell flowers"] }
    ]
  },
  {
    levelNumber: 3,
    name: "Adjectives & Adverbs",
    subtitle: "Type the Word",
    miniGameType: MINI_GAME_TYPES.TYPING,
    totalQuestions: 12,
    timePerQuestion: 20,
    requiredCorrect: 9,
    vocabulary: [
      { word: "happy", clue: "Feeling of joy and pleasure", correctAnswer: "happy" },
      { word: "quickly", clue: "Done in a fast manner", correctAnswer: "quickly" },
      { word: "beautiful", clue: "Pleasing to look at", correctAnswer: "beautiful" },
      { word: "slowly", clue: "Moving at a low speed", correctAnswer: "slowly" },
      { word: "tall", clue: "Having great height", correctAnswer: "tall" },
      { word: "loudly", clue: "Making a lot of noise", correctAnswer: "loudly" },
      { word: "bright", clue: "Giving off much light", correctAnswer: "bright" },
      { word: "gently", clue: "In a soft, careful way", correctAnswer: "gently" },
      { word: "cold", clue: "Low in temperature", correctAnswer: "cold" },
      { word: "quietly", clue: "Making little sound", correctAnswer: "quietly" },
      { word: "warm", clue: "Moderately hot", correctAnswer: "warm" },
      { word: "carefully", clue: "With attention to detail", correctAnswer: "carefully" }
    ]
  },
  {
    levelNumber: 4,
    name: "Intermediate Nouns",
    subtitle: "Word to Image",
    miniGameType: MINI_GAME_TYPES.WORD_TO_IMAGE,
    totalQuestions: 12,
    timePerQuestion: 10,
    requiredCorrect: 9,
    vocabulary: [
      { word: "bicycle", correctAnswer: "bicycle", options: ["bicycle", "car", "train", "airplane"] },
      { word: "instrument", correctAnswer: "instrument", options: ["instrument", "book", "chair", "lamp"] },
      { word: "mountain", correctAnswer: "mountain", options: ["mountain", "river", "desert", "forest"] },
      { word: "library", correctAnswer: "library", options: ["library", "store", "hospital", "school"] },
      { word: "universe", correctAnswer: "universe", options: ["universe", "planet", "star", "moon"] },
      { word: "pyramid", correctAnswer: "pyramid", options: ["pyramid", "cube", "sphere", "cylinder"] },
      { word: "telescope", correctAnswer: "telescope", options: ["telescope", "microscope", "camera", "binoculars"] },
      { word: "castle", correctAnswer: "castle", options: ["castle", "tower", "bridge", "tunnel"] },
      { word: "volcano", correctAnswer: "volcano", options: ["volcano", "mountain", "hill", "canyon"] },
      { word: "compass", correctAnswer: "compass", options: ["compass", "map", "clock", "ruler"] },
      { word: "fountain", correctAnswer: "fountain", options: ["fountain", "pond", "well", "waterfall"] },
      { word: "lighthouse", correctAnswer: "lighthouse", options: ["lighthouse", "tower", "windmill", "barn"] }
    ]
  },
  {
    levelNumber: 5,
    name: "Phrasal Verbs",
    subtitle: "Complete Sentence",
    miniGameType: MINI_GAME_TYPES.SENTENCE_COMPLETION,
    totalQuestions: 10,
    timePerQuestion: 15,
    requiredCorrect: 8,
    vocabulary: [
      { 
        sentence: "Please ___ the lights when you leave",
        correctAnswer: "turn off",
        options: ["turn off", "turn on", "turn up", "turn down"]
      },
      { 
        sentence: "I need to ___ this word in the dictionary",
        correctAnswer: "look up",
        options: ["look up", "look down", "look at", "look for"]
      },
      { 
        sentence: "Don't ___ on your dreams",
        correctAnswer: "give up",
        options: ["give up", "give in", "give out", "give away"]
      },
      { 
        sentence: "My car might ___ on the highway",
        correctAnswer: "break down",
        options: ["break down", "break up", "break in", "break out"]
      },
      { 
        sentence: "They had to ___ the meeting due to rain",
        correctAnswer: "call off",
        options: ["call off", "call on", "call up", "call in"]
      },
      { 
        sentence: "Can you ___ the volume please?",
        correctAnswer: "turn down",
        options: ["turn down", "turn up", "turn off", "turn on"]
      },
      { 
        sentence: "I'll ___ you at 7 PM",
        correctAnswer: "pick up",
        options: ["pick up", "pick out", "pick on", "pick at"]
      },
      { 
        sentence: "Please ___ this form completely",
        correctAnswer: "fill out",
        options: ["fill out", "fill in", "fill up", "fill down"]
      },
      { 
        sentence: "Let's ___ the new restaurant tonight",
        correctAnswer: "try out",
        options: ["try out", "try on", "try for", "try with"]
      },
      { 
        sentence: "I finally ___ how to solve it",
        correctAnswer: "figured out",
        options: ["figured out", "figured in", "figured on", "figured up"]
      }
    ]
  }
];

export function getLevelData(levelNumber) {
  return LEVELS.find(level => level.levelNumber === levelNumber);
}