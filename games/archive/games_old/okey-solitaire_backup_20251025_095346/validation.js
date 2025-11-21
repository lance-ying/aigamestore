import { gameState } from './globals.js';

export function validateHand(tiles, okeyTile) {
  if (tiles.length !== 14) return false;
  
  // Deep copy tiles to avoid modifying original
  const hand = tiles.map(t => ({ color: t.color, number: t.number, isJoker: t.isJoker, isOkey: isOkeyTile(t, okeyTile) }));
  
  // Try to form valid sets and runs
  return tryFormValidGroups(hand);
}

function isOkeyTile(tile, okeyTile) {
  if (!okeyTile || tile.isJoker) return tile.isJoker;
  return tile.color === okeyTile.color && tile.number === okeyTile.number;
}

function tryFormValidGroups(hand) {
  // Count wildcards
  const wildcards = hand.filter(t => t.isJoker || t.isOkey);
  const normalTiles = hand.filter(t => !t.isJoker && !t.isOkey);
  
  // Try to partition tiles into groups
  return canPartition(normalTiles, wildcards.length, []);
}

function canPartition(tiles, wildcardCount, usedGroups) {
  if (tiles.length === 0 && wildcardCount === 0) return true;
  if (tiles.length === 0 && wildcardCount > 0) return wildcardCount >= 3; // Remaining wildcards form a group
  
  // Try forming a set
  for (let i = 0; i < tiles.length; i++) {
    const setTiles = tiles.filter(t => t.number === tiles[i].number && t.color !== tiles[i].color);
    
    if (setTiles.length + 1 >= 3) {
      // We can form a set with 3 tiles
      const setSize = Math.min(4, setTiles.length + 1);
      const needed = setSize - (setTiles.length + 1);
      
      if (needed <= wildcardCount) {
        const remaining = tiles.filter(t => {
          if (t === tiles[i]) return false;
          let count = setSize - 1;
          for (const st of setTiles) {
            if (t === st && count > 0) {
              count--;
              return false;
            }
          }
          return true;
        });
        
        if (canPartition(remaining, wildcardCount - needed, [...usedGroups, { type: 'set', size: setSize }])) {
          return true;
        }
      }
    }
  }
  
  // Try forming a run
  for (let i = 0; i < tiles.length; i++) {
    const runTiles = findRun(tiles, tiles[i], wildcardCount);
    
    if (runTiles.length >= 3) {
      const remaining = tiles.filter(t => !runTiles.includes(t));
      const wildcardsUsed = Math.max(0, 3 - runTiles.length);
      
      if (canPartition(remaining, wildcardCount - wildcardsUsed, [...usedGroups, { type: 'run', size: runTiles.length }])) {
        return true;
      }
    }
  }
  
  return false;
}

function findRun(tiles, startTile, wildcardCount) {
  const sameSuit = tiles.filter(t => t.color === startTile.color).sort((a, b) => a.number - b.number);
  
  for (let start = 0; start < sameSuit.length; start++) {
    const run = [sameSuit[start]];
    let nextNum = sameSuit[start].number + 1;
    let wildcardsNeeded = 0;
    
    for (let j = start + 1; j < sameSuit.length && run.length < 13; j++) {
      if (sameSuit[j].number === nextNum) {
        run.push(sameSuit[j]);
        nextNum++;
      } else if (sameSuit[j].number > nextNum) {
        const gap = sameSuit[j].number - nextNum;
        if (wildcardsNeeded + gap <= wildcardCount) {
          wildcardsNeeded += gap;
          run.push(sameSuit[j]);
          nextNum = sameSuit[j].number + 1;
        }
      }
    }
    
    if (run.length + wildcardsNeeded >= 3) {
      return run;
    }
  }
  
  return [];
}

export function evaluateHandStrength(tiles, okeyTile) {
  let score = 0;
  
  // Count sets
  const numbers = {};
  for (const tile of tiles) {
    if (!tile.isJoker && !isOkeyTile(tile, okeyTile)) {
      if (!numbers[tile.number]) numbers[tile.number] = [];
      numbers[tile.number].push(tile);
    }
  }
  
  for (const num in numbers) {
    const count = numbers[num].length;
    if (count >= 2) score += count * 10;
    if (count >= 3) score += 50;
  }
  
  // Count potential runs
  for (const color of ['RED', 'BLUE', 'BLACK', 'YELLOW']) {
    const colorTiles = tiles.filter(t => t.color === color && !t.isJoker).sort((a, b) => a.number - b.number);
    
    let consecutive = 1;
    for (let i = 1; i < colorTiles.length; i++) {
      if (colorTiles[i].number === colorTiles[i - 1].number + 1) {
        consecutive++;
        score += 15;
      } else {
        consecutive = 1;
      }
      
      if (consecutive >= 3) score += 40;
    }
  }
  
  // Wildcards are valuable
  const wildcards = tiles.filter(t => t.isJoker || isOkeyTile(t, okeyTile));
  score += wildcards.length * 100;
  
  return score;
}