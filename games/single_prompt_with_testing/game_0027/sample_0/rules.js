// rules.js - Rule parsing and management

import { gameState } from './globals.js';
import { WORD_NOUN, WORD_IS, WORD_PROPERTY } from './globals.js';

export class Rule {
  constructor(noun, property) {
    this.noun = noun;
    this.property = property;
  }
}

export function parseRules() {
  const rules = [];
  const wordBlocks = gameState.wordBlocks.filter(wb => !wb.deleted);

  // Check horizontal rules
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 13; x++) {
      const word1 = wordBlocks.find(wb => wb.gridX === x && wb.gridY === y);
      const word2 = wordBlocks.find(wb => wb.gridX === x + 1 && wb.gridY === y);
      const word3 = wordBlocks.find(wb => wb.gridX === x + 2 && wb.gridY === y);

      if (word1 && word2 && word3 &&
          word1.wordType === WORD_NOUN &&
          word2.wordType === WORD_IS &&
          word3.wordType === WORD_PROPERTY) {
        rules.push(new Rule(word1.word, word3.word));
      }
    }
  }

  // Check vertical rules
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 15; x++) {
      const word1 = wordBlocks.find(wb => wb.gridX === x && wb.gridY === y);
      const word2 = wordBlocks.find(wb => wb.gridX === x && wb.gridY === y + 1);
      const word3 = wordBlocks.find(wb => wb.gridX === x && wb.gridY === y + 2);

      if (word1 && word2 && word3 &&
          word1.wordType === WORD_NOUN &&
          word2.wordType === WORD_IS &&
          word3.wordType === WORD_PROPERTY) {
        rules.push(new Rule(word1.word, word3.word));
      }
    }
  }

  gameState.activeRules = rules;
  updatePlayerControlledTypes();
}

export function updatePlayerControlledTypes() {
  gameState.playerControlledTypes = [];
  for (const rule of gameState.activeRules) {
    if (rule.property === "YOU") {
      gameState.playerControlledTypes.push(rule.noun);
    }
  }
}

export function hasProperty(type, property) {
  for (const rule of gameState.activeRules) {
    if (rule.noun === type && rule.property === property) {
      return true;
    }
  }
  return false;
}

export function getObjectsWithProperty(property) {
  const types = [];
  for (const rule of gameState.activeRules) {
    if (rule.property === property) {
      types.push(rule.noun);
    }
  }
  return types;
}