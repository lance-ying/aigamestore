// TypeScript types for gameplay data

export interface InputEvent {
  timestamp: number;
  type: 'keydown' | 'keyup' | 'mousedown' | 'mouseup' | 'mousemove';

  // Keyboard events
  key?: string;
  code?: string;

  // Mouse events
  x?: number;
  y?: number;
  button?: number;
}

export interface ScoreDataPoint {
  frame: number;
  timestamp: number;
  score: number;
}

export interface InputLog {
  score?: number | null; // Final score (for backward compatibility)
  scoreTimeSeries?: ScoreDataPoint[]; // Score tracked frame-by-frame
  events: InputEvent[];
}

export interface DeviceInfo {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  screenDepth?: number;
  screenPixelDepth?: number;
  devicePixelRatio?: number;
  timezone?: string;
  language?: string;
  hardwareConcurrency?: number | null;
  deviceMemory?: number | null;
  maxTouchPoints?: number;
  platform?: string;
  vendor?: string;
  ip?: string | null;
}

export interface SessionMetadata {
  sessionId: string;
  gameId: string;
  userId: string;
  startTime: string;
  endTime: string;
  duration: number;
  fps: number;
  videoWidth: number;
  videoHeight: number;
  completed?: boolean;
  deviceInfo?: DeviceInfo;
}

export interface GameplaySession {
  sessionId: string;
  userId: string;
  gameId: string;

  // Storage URLs
  videoUrl: string;
  inputsUrl: string;
  scoresUrl: string;
  metadataUrl: string;

  // Session info
  timestamp: Date;
  duration: number;
  completed: boolean;

  // Game performance
  score?: number; // Final score (for backward compatibility)
  scoreTimeSeries?: ScoreDataPoint[]; // Score tracked frame-by-frame

  // Prolific study tracking
  prolificId?: string;  // PROLIFIC_PID from URL
  modelId?: string;     // MODEL_ID from URL
  studyId?: string;
  prolificSessionId?: string;

  // Device info
  deviceInfo: DeviceInfo;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  userId: string;
  createdAt: Date;
  lastActiveAt: Date;
  totalSessions: number;
  gamesPlayed: string[];
}

export interface Game {
  gameId: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  totalSessions: number;
  createdAt: Date;
  active: boolean;
}

export interface RecordingCompleteMessage {
  action: 'recordingComplete';
  sessionId: string;
  score?: number | null;
  video: Blob;
  inputs: Blob;
  scores: Blob;
  metadata: Blob;
}

export interface RecorderStartedMessage {
  action: 'recorderStarted';
  mimeType: string;
}

export type RecorderMessage = RecordingCompleteMessage | RecorderStartedMessage;
