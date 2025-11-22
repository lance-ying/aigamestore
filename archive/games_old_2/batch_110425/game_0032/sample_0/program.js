// program.js - Program production logic
import { gameState, SYNERGY_MAP, SET_PIECES } from './globals.js';
import { getTalentSkillForGenre } from './talent.js';

export function calculateProgramQuality() {
  const program = gameState.currentProgram;
  
  if (!program.genre || !program.theme || !program.host) {
    return 0;
  }
  
  // Base quality from host skill
  const hostSkill = getTalentSkillForGenre(program.host, program.genre);
  let quality = hostSkill;
  
  // Add guest contributions (50% weight)
  let guestContribution = 0;
  program.guests.forEach(guest => {
    guestContribution += getTalentSkillForGenre(guest, program.genre) * 0.5;
  });
  quality += guestContribution;
  
  // Genre-theme synergy bonus
  const synergyKey = `${program.genre}-${program.theme}`;
  const synergyMultiplier = SYNERGY_MAP[synergyKey] || 1.0;
  quality *= synergyMultiplier;
  
  // Studio atmosphere from set pieces
  let atmosphere = 0;
  program.setPieces.forEach(pieceId => {
    const piece = SET_PIECES.find(p => p.id === pieceId);
    if (piece) {
      atmosphere += piece.atmosphere;
    }
  });
  quality += atmosphere * 2;
  
  // Add some randomness (±10%)
  const randomFactor = 0.9 + Math.random() * 0.2;
  quality *= randomFactor;
  
  return Math.max(0, Math.min(100, Math.floor(quality)));
}

export function calculateRating(quality) {
  // Convert quality (0-100) to rating (0-100%)
  // Quality directly translates to rating with some curve
  const baseRating = quality * 0.8;
  
  // Station rank bonus
  const rankBonus = (gameState.stationRank - 1) * 2;
  
  const rating = Math.min(100, baseRating + rankBonus);
  return Math.max(0, Math.floor(rating));
}

export function calculateRewards(rating, quality) {
  // Calculate fans gained
  const baseFans = Math.floor(rating / 5);
  const qualityBonus = Math.floor(quality / 10);
  const fans = baseFans + qualityBonus;
  
  // Calculate SNS buzz
  const buzz = Math.floor(rating * 1.5);
  
  // Calculate research points
  const research = Math.floor(quality / 4);
  
  // Score is total viewership
  const score = Math.floor(rating * 10);
  
  return { fans, buzz, research, score };
}

export function produceProgram() {
  const quality = calculateProgramQuality();
  const rating = calculateRating(quality);
  const rewards = calculateRewards(rating, quality);
  
  gameState.currentProgram.quality = quality;
  gameState.currentProgram.rating = rating;
  
  // Apply rewards
  gameState.fans += rewards.fans;
  gameState.snsBuzz += rewards.buzz;
  gameState.researchPoints += rewards.research;
  gameState.score += rewards.score;
  gameState.programsProduced++;
  
  // Update station rank
  updateStationRank();
  
  // Release hired talent back to pool
  if (gameState.currentProgram.host) {
    gameState.currentProgram.host.hired = false;
  }
  gameState.currentProgram.guests.forEach(guest => {
    guest.hired = false;
  });
  
  // Check for new talent unlock based on SNS buzz
  if (gameState.snsBuzz >= 200 && gameState.availableTalent.length < 15) {
    const newTalent = generateNewTalentFromBuzz();
    if (newTalent.length > 0) {
      gameState.availableTalent.push(...newTalent);
    }
  }
  
  return { quality, rating, rewards };
}

function updateStationRank() {
  if (gameState.programsProduced >= 20 && gameState.stationRank < 5) {
    gameState.stationRank = 5;
  } else if (gameState.programsProduced >= 15 && gameState.stationRank < 4) {
    gameState.stationRank = 4;
  } else if (gameState.programsProduced >= 10 && gameState.stationRank < 3) {
    gameState.stationRank = 3;
  } else if (gameState.programsProduced >= 5 && gameState.stationRank < 2) {
    gameState.stationRank = 2;
  }
}

function generateNewTalentFromBuzz() {
  // Import at top would cause circular dependency, so we use the function from talent.js
  const names = ["Iris", "Jazz", "Kobe", "Lux", "Max"];
  const talent = [];
  
  if (gameState.availableTalent.length < 12) {
    const existingIds = gameState.availableTalent.map(t => t.id);
    const nextId = Math.max(...existingIds) + 1;
    
    talent.push({
      id: nextId,
      name: names[Math.floor(Math.random() * names.length)],
      talkSkill: 40 + Math.floor(Math.random() * 40),
      performSkill: 40 + Math.floor(Math.random() * 40),
      appealSkill: 40 + Math.floor(Math.random() * 40),
      tier: 2,
      hired: false
    });
  }
  
  return talent;
}

export function resetCurrentProgram() {
  gameState.currentProgram = {
    genre: null,
    theme: null,
    host: null,
    guests: [],
    setPieces: [],
    rating: 0,
    quality: 0
  };
  
  // Clear studio grid
  for (let y = 0; y < gameState.studioGrid.length; y++) {
    for (let x = 0; x < gameState.studioGrid[y].length; x++) {
      gameState.studioGrid[y][x] = null;
    }
  }
}