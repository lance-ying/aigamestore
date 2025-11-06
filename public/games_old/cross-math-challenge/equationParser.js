// equationParser.js - Equation parsing and validation

import { gameState } from './globals.js';

export function evaluateEquation(tokens) {
  // Tokens are in format: [number/value, operator, number/value, operator, ..., '=', result]
  // We need to parse left side and compare to result
  
  // Find the equals sign
  const equalsIndex = tokens.indexOf('=');
  if (equalsIndex === -1) return { valid: false, result: null };

  const leftTokens = tokens.slice(0, equalsIndex);
  const expectedResult = tokens[equalsIndex + 1];

  if (leftTokens.length === 0 || expectedResult === null || expectedResult === undefined) {
    return { valid: false, result: null };
  }

  const calculatedResult = calculateExpression(leftTokens);
  
  return {
    valid: calculatedResult !== null && Math.abs(calculatedResult - expectedResult) < 0.0001,
    calculated: calculatedResult,
    expected: expectedResult
  };
}

function calculateExpression(tokens) {
  if (tokens.length === 0) return null;
  if (tokens.length === 1) return tokens[0];

  // Check for any null values
  for (let token of tokens) {
    if (token === null || token === undefined || token === '') return null;
  }

  // Apply order of operations: * and / first
  let processedTokens = [...tokens];
  
  // First pass: handle * and /
  for (let i = 1; i < processedTokens.length; i += 2) {
    const operator = processedTokens[i];
    if (operator === '*' || operator === '/') {
      const left = Number(processedTokens[i - 1]);
      const right = Number(processedTokens[i + 1]);
      
      if (isNaN(left) || isNaN(right)) return null;
      
      let result;
      if (operator === '*') {
        result = left * right;
      } else {
        if (right === 0) return null;
        result = left / right;
      }
      
      processedTokens.splice(i - 1, 3, result);
      i -= 2; // Adjust index after splice
    }
  }
  
  // Second pass: handle + and -
  for (let i = 1; i < processedTokens.length; i += 2) {
    const operator = processedTokens[i];
    if (operator === '+' || operator === '-') {
      const left = Number(processedTokens[i - 1]);
      const right = Number(processedTokens[i + 1]);
      
      if (isNaN(left) || isNaN(right)) return null;
      
      let result;
      if (operator === '+') {
        result = left + right;
      } else {
        result = left - right;
      }
      
      processedTokens.splice(i - 1, 3, result);
      i -= 2; // Adjust index after splice
    }
  }
  
  return processedTokens.length === 1 ? Number(processedTokens[0]) : null;
}

export function validatePuzzle() {
  const grid = gameState.currentGridData;
  const size = gameState.gridSize;
  let allCorrect = true;
  let incorrectCells = [];

  // Check all rows
  for (let row = 0; row < size; row++) {
    const tokens = [];
    for (let col = 0; col < size; col++) {
      const cell = grid[row][col];
      let value;
      
      if (cell.type === 'number') {
        value = cell.value;
      } else if (cell.type === 'operator') {
        value = cell.value;
      } else if (cell.type === 'empty') {
        value = cell.playerInput !== '' ? Number(cell.playerInput) : null;
      }
      
      tokens.push(value);
    }
    
    const result = evaluateEquation(tokens);
    if (!result.valid) {
      allCorrect = false;
      for (let col = 0; col < size; col++) {
        incorrectCells.push({ row, col });
      }
    }
  }

  // Check all columns
  for (let col = 0; col < size; col++) {
    const tokens = [];
    for (let row = 0; row < size; row++) {
      const cell = grid[row][col];
      let value;
      
      if (cell.type === 'number') {
        value = cell.value;
      } else if (cell.type === 'operator') {
        value = cell.value;
      } else if (cell.type === 'empty') {
        value = cell.playerInput !== '' ? Number(cell.playerInput) : null;
      }
      
      tokens.push(value);
    }
    
    const result = evaluateEquation(tokens);
    if (!result.valid) {
      allCorrect = false;
      for (let row = 0; row < size; row++) {
        incorrectCells.push({ row, col });
      }
    }
  }

  return { valid: allCorrect, incorrectCells };
}

export function checkAllCellsFilled() {
  for (let row = 0; row < gameState.gridSize; row++) {
    for (let col = 0; col < gameState.gridSize; col++) {
      const cell = gameState.currentGridData[row][col];
      if (cell.type === 'empty' && cell.playerInput === '') {
        return false;
      }
    }
  }
  return true;
}