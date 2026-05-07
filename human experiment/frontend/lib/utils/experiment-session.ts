export interface Game {
  id: string;
  title: string;
  description: string;
  controls: string;
  path: string;
  originalName: string;
  originalGameName?: string;
  originalGameUrl?: string;
  hidden?: boolean;
}

export interface ExperimentSession {
  consented: boolean;
  participantId: number;
  games: Game[];
  currentIndex: number;
  sessionStartTime: number;
  gameTimers: {
    [gameIndex: number]: {
      startTime: number; // When the timer started for this game
    };
  };
}

const SESSION_STORAGE_KEY = 'experiment_session';
const PARTICIPANT_COUNTER_KEY = 'next_participant_id';
export const GAME_DURATION_MS = 120 * 1000; // 2 minutes (120 seconds) in milliseconds

// Configuration flags
const TEST_PHYSITYPE = false; // Set to true to add physitype as first game for testing
const FORCE_PARTICIPANT_0 = false; // Set to true to always use participant 0's sequence for testing

interface SequenceData {
  participant_id: number;
  evaluations: string[]; // Array of game IDs
}

interface SequencesFile {
  config: {
    num_participants: number;
    sequence_length: number;
    least_ratings_per_game: number;
    require_each_method_once: boolean;
  };
  sequences: SequenceData[];
  metadata: any;
}

/**
 * Get next participant ID using a global counter
 * Each new user gets the next ID, which assigns them to the next sequence
 */
async function getNextParticipantId(): Promise<number> {
  try {
    // Call API to get and increment the global counter
    const response = await fetch('/api/experiment/next-participant-id', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to get participant ID');
    }

    const data = await response.json();
    console.log(`[Experiment] Assigned participant ID: ${data.participantId}`);
    return data.participantId;
  } catch (error) {
    console.error('Failed to get participant ID from server:', error);
    // Fallback: generate random ID
    const randomId = Math.floor(Math.random() * 10000);
    console.log(`[Experiment] Using fallback random ID: ${randomId}`);
    return randomId;
  }
}

/**
 * Load pre-generated sequences from JSON file
 */
async function loadSequences(): Promise<SequencesFile | null> {
  try {
    const response = await fetch('/games-sequences.json');
    if (!response.ok) {
      throw new Error('Failed to load sequences');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load experiment sequences:', error);
    return null;
  }
}

/**
 * Get games for a specific sequence by matching game IDs from manifest
 */
function getGamesForSequence(gameIds: string[], allGames: Game[]): Game[] {
  const gamesMap = new Map(allGames.map(g => [g.id, g]));
  const sequenceGames: Game[] = [];

  for (const gameId of gameIds) {
    const game = gamesMap.get(gameId);
    if (game) {
      sequenceGames.push(game);
    } else {
      console.warn(`Game not found in manifest: ${gameId}`);
    }
  }

  return sequenceGames;
}

/**
 * Initialize a new experiment session with game sequences
 */
export async function initializeSession(allGames: Game[]): Promise<ExperimentSession | null> {
  // Get next participant ID from global counter (or force to 0 for testing)
  let participantId = await getNextParticipantId();

  if (FORCE_PARTICIPANT_0) {
    participantId = 0;
    console.log('[Experiment] FORCE_PARTICIPANT_0 enabled - using participant 0 sequence');
  }

  // Load sequences first to detect the game prefix
  const sequencesData = await loadSequences();
  if (!sequencesData || !sequencesData.sequences) {
    console.error('Failed to load sequences, falling back to all games');
    console.error('[Experiment] This should not happen - sequences file should be available!');
    // Fallback: use all games (should not happen if sequences file exists)
    const selectedGames = allGames.filter(game => !game.hidden);
    
    const session: ExperimentSession = {
      consented: true,
      participantId,
      games: selectedGames,
      currentIndex: 0,
      sessionStartTime: Date.now(),
      gameTimers: {},
    };
    
    session.gameTimers[0] = {
      startTime: Date.now(),
    };
    
    saveSession(session);
    return session;
  }

  // Detect game prefix from the first sequence's first game ID
  let gamePrefix: string | null = null;
  if (sequencesData.sequences.length > 0 && sequencesData.sequences[0].evaluations.length > 0) {
    const firstGameId = sequencesData.sequences[0].evaluations[0];
    const prefixMatch = firstGameId.match(/^([^/]+)\//);
    if (prefixMatch) {
      gamePrefix = prefixMatch[1];
      console.log(`[Experiment] Detected game prefix: ${gamePrefix}`);
    }
  }

  // Filter games based on detected prefix (if available)
  let availableGames = allGames.filter(game => !game.hidden);
  if (gamePrefix) {
    availableGames = availableGames.filter(game => 
      game.id.startsWith(`${gamePrefix}/`)
    );
  }

  if (availableGames.length === 0) {
    const prefixMsg = gamePrefix ? ` with prefix '${gamePrefix}/'` : '';
    console.error(`No games available${prefixMsg}`);
    return null;
  }

  // Get the sequence for this participant (participantId is 0-indexed)
  // Use modulo to cycle through sequences if participant ID exceeds available sequences
  const sequenceIndex = participantId % sequencesData.sequences.length;
  const participantSequence = sequencesData.sequences[sequenceIndex];
  
  console.log(`[Experiment] Participant ID: ${participantId} → Using sequence index: ${sequenceIndex} (cycling through ${sequencesData.sequences.length} sequences)`);
  
  if (!participantSequence) {
    console.error(`No sequence found for participant ${participantId} at index ${sequenceIndex} (sequences available: ${sequencesData.sequences.length})`);
    console.error(`[Experiment] Falling back to all games - this should not happen!`);
    // Fallback: use all games (should not happen if sequences are properly configured)
    const selectedGames = availableGames;
    
    const session: ExperimentSession = {
      consented: true,
      participantId,
      games: selectedGames,
      currentIndex: 0,
      sessionStartTime: Date.now(),
      gameTimers: {},
    };
    
    session.gameTimers[0] = {
      startTime: Date.now(),
    };
    
    saveSession(session);
    return session;
  }
  
  // Get games for this sequence by matching game IDs
  let selectedGames = getGamesForSequence(participantSequence.evaluations, availableGames);

  console.log(`[Experiment] Participant ID: ${participantId} → Sequence ${sequenceIndex} with ${selectedGames.length} games (2 minutes each)`);
  console.log(`[Experiment] Expected ${participantSequence.evaluations.length} games in sequence, found ${selectedGames.length} games`);

  if (selectedGames.length === 0) {
    console.error('No games found for sequence');
    return null;
  }

  // Validate that we got the expected number of games
  if (selectedGames.length !== participantSequence.evaluations.length) {
    console.warn(`[Experiment] Warning: Expected ${participantSequence.evaluations.length} games but got ${selectedGames.length}. Some games may not be in manifest.`);
  }

  // Add physitype as first game for testing if flag is enabled
  if (TEST_PHYSITYPE) {
    const physitypeGame: Game = {
      id: "games/physitype",
      title: "PhysiType",
      path: "/games/physitype",
      originalName: "physitype",
      description: "PhysiType is a physics-based puzzle game where your words become physical objects.\nThe goal of each level is to collect all the shining target dots.\nYou do this by typing letters into the spawn line. Each letter has unique physical properties—an 'o' will roll, an 'l' is a solid beam, and a 'p' is top-heavy.\nPlan your text carefully, position spaces to adjust falling points, and press ENTER to bring your letters to life!",
      controls: "A-Z: Type letters to spawn\nSPACE: Add spacing between letters\nBACKSPACE: Remove last letter\nENTER: Start simulation (turn text into physics bodies)\nR: Reset level (if simulation fails) / Restart Game (at Game Over)\nESC: Pause / Unpause\nARROW KEYS: Pan camera (if zoomed in or large level)",
    };

    // Remove physitype if it already exists in the sequence
    selectedGames = selectedGames.filter(game => game.originalName !== 'physitype');

    // Add it as the first game
    selectedGames = [physitypeGame, ...selectedGames];

    console.log(`[Experiment] TEST_PHYSITYPE enabled - added PhysiType as first game`);
  }

  const session: ExperimentSession = {
    consented: true,
    participantId,
    games: selectedGames,
    currentIndex: 0,
    sessionStartTime: Date.now(),
    gameTimers: {},
  };

  // Initialize timer for first game
  session.gameTimers[0] = {
    startTime: Date.now(),
  };

  saveSession(session);
  return session;
}

/**
 * Get current session from storage
 */
export function getSession(): ExperimentSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ExperimentSession;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

/**
 * Save session to storage
 */
export function saveSession(session: ExperimentSession): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

/**
 * Update current game index and initialize timer
 */
export function advanceToNextGame(session: ExperimentSession): ExperimentSession {
  const nextIndex = session.currentIndex + 1;

  // Always reinitialize timer for next game with fresh start time
  session.gameTimers[nextIndex] = {
    startTime: Date.now(),
  };

  session.currentIndex = nextIndex;
  saveSession(session);
  return session;
}

/**
 * Get remaining time for a game (calculated from startTime)
 */
export function getRemainingTime(session: ExperimentSession, gameIndex: number): number {
  const timer = session.gameTimers[gameIndex];
  if (!timer) return GAME_DURATION_MS;
  
  const elapsed = Date.now() - timer.startTime;
  const remaining = Math.max(0, GAME_DURATION_MS - elapsed);
  return remaining;
}

/**
 * Clear session from storage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Get game duration constant
 */
export function getGameDuration(): number {
  return GAME_DURATION_MS;
}

