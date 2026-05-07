// Firestore Query Helpers
// Server-side utilities for querying Firestore

import { db } from './admin';
import { GameplaySession, User, Game, DeviceInfo } from '../types/gameplay';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Create a new gameplay session record in Firestore
 */
export async function createSession(
  sessionId: string,
  userId: string,
  gameId: string,
  deviceInfo?: Partial<DeviceInfo>,
  prolificId?: string,
  modelId?: string
): Promise<void> {
  try {
    await db.collection('gameplay_sessions').doc(sessionId).set({
      sessionId,
      userId,
      gameId,
      prolificId: prolificId || null,
      modelId: modelId || null,
      timestamp: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      completed: false,
      videoUrl: '',
      inputsUrl: '',
      metadataUrl: '',
      duration: 0,
      deviceInfo: deviceInfo || {
        userAgent: '',
        screenWidth: 0,
        screenHeight: 0,
        ip: null,
      },
    });

    console.log(`Created session record: ${sessionId}`);
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error(`Failed to create session: ${error}`);
  }
}

/**
 * Update session with uploaded file URLs and metadata
 */
export async function updateSessionWithFiles(
  sessionId: string,
  urls: {
    videoUrl: string;
    inputsUrl: string;
    scoresUrl?: string;
    metadataUrl: string;
  },
  metadata: {
    duration: number;
    deviceInfo: DeviceInfo;
  }
): Promise<void> {
  try {
    const updateData: any = {
      videoUrl: urls.videoUrl,
      inputsUrl: urls.inputsUrl,
      metadataUrl: urls.metadataUrl,
      duration: metadata.duration,
      deviceInfo: metadata.deviceInfo,
      completed: true,
      updatedAt: Timestamp.now(),
    };

    if (urls.scoresUrl) {
      updateData.scoresUrl = urls.scoresUrl;
    }

    await db.collection('gameplay_sessions').doc(sessionId).update(updateData);

    console.log(`Updated session with files: ${sessionId}`);
  } catch (error) {
    console.error('Error updating session:', error);
    throw new Error(`Failed to update session: ${error}`);
  }
}

/**
 * Get all sessions for a specific game
 */
export async function getGameSessions(
  gameId: string,
  limit: number = 100
): Promise<GameplaySession[]> {
  try {
    const snapshot = await db
      .collection('gameplay_sessions')
      .where('gameId', '==', gameId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as GameplaySession;
    });
  } catch (error) {
    console.error('Error fetching game sessions:', error);
    throw new Error(`Failed to fetch game sessions: ${error}`);
  }
}

/**
 * Get all sessions for a specific user
 */
export async function getUserSessions(
  userId: string,
  limit: number = 100
): Promise<GameplaySession[]> {
  try {
    const snapshot = await db
      .collection('gameplay_sessions')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as GameplaySession;
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    throw new Error(`Failed to fetch user sessions: ${error}`);
  }
}

/**
 * Get a specific session by ID
 */
export async function getSession(sessionId: string): Promise<GameplaySession | null> {
  try {
    const doc = await db.collection('gameplay_sessions').doc(sessionId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      ...data,
      timestamp: data.timestamp.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as GameplaySession;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw new Error(`Failed to fetch session: ${error}`);
  }
}

/**
 * Delete a session record
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await db.collection('gameplay_sessions').doc(sessionId).delete();
    console.log(`Deleted session record: ${sessionId}`);
  } catch (error) {
    console.error('Error deleting session:', error);
    throw new Error(`Failed to delete session: ${error}`);
  }
}

/**
 * Create or update user record
 */
export async function upsertUser(userId: string, gameId?: string): Promise<void> {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create new user
      await userRef.set({
        userId,
        createdAt: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
        totalSessions: 0,
        gamesPlayed: gameId ? [gameId] : [],
      });
    } else {
      // Update existing user
      const updateData: any = {
        lastActiveAt: Timestamp.now(),
      };

      if (gameId) {
        const userData = userDoc.data()!;
        const gamesPlayed = userData.gamesPlayed || [];
        if (!gamesPlayed.includes(gameId)) {
          updateData.gamesPlayed = [...gamesPlayed, gameId];
        }
      }

      await userRef.update(updateData);
    }
  } catch (error) {
    console.error('Error upserting user:', error);
    throw new Error(`Failed to upsert user: ${error}`);
  }
}

/**
 * Increment user session count
 */
export async function incrementUserSessionCount(userId: string): Promise<void> {
  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      totalSessions: (await userRef.get()).data()?.totalSessions ?? 0 + 1,
    });
  } catch (error) {
    console.error('Error incrementing session count:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
  try {
    const doc = await db.collection('users').doc(userId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      lastActiveAt: data.lastActiveAt.toDate(),
    } as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error(`Failed to fetch user: ${error}`);
  }
}

/**
 * Delete all session records for a user (GDPR compliance)
 */
export async function deleteUserSessions(userId: string): Promise<void> {
  try {
    const snapshot = await db
      .collection('gameplay_sessions')
      .where('userId', '==', userId)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.docs.length} session records for user ${userId}`);
  } catch (error) {
    console.error('Error deleting user sessions:', error);
    throw new Error(`Failed to delete user sessions: ${error}`);
  }
}

/**
 * Delete user record
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    await db.collection('users').doc(userId).delete();
    console.log(`Deleted user record: ${userId}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error(`Failed to delete user: ${error}`);
  }
}

/**
 * Update session with game score
 */
export async function updateSessionScore(
  sessionId: string,
  score: number
): Promise<void> {
  try {
    await db.collection('gameplay_sessions').doc(sessionId).update({
      score,
      updatedAt: Timestamp.now(),
    });

    console.log(`Updated session score: ${sessionId} = ${score}`);
  } catch (error) {
    console.error('Error updating session score:', error);
    throw new Error(`Failed to update session score: ${error}`);
  }
}

/**
 * Update session with score time series (frame-by-frame score data)
 */
export async function updateSessionScoreTimeSeries(
  sessionId: string,
  scoreTimeSeries: Array<{ frame: number; timestamp: number; score: number }>
): Promise<void> {
  try {
    await db.collection('gameplay_sessions').doc(sessionId).update({
      scoreTimeSeries,
      updatedAt: Timestamp.now(),
    });

    console.log(`Updated session score time series: ${sessionId} with ${scoreTimeSeries.length} data points`);
  } catch (error) {
    console.error('Error updating session score time series:', error);
    throw new Error(`Failed to update session score time series: ${error}`);
  }
}

/**
 * Update session with prolific and model IDs
 */
/**
 * Update session with game feedback
 */
export async function updateSessionFeedback(
  sessionId: string,
  gameId: string,
  feedback: {
    similarGame: number | 'yes' | 'no'; // Can be number (0-100) or legacy yes/no
    playFrequency: string;
    funRating: number;
    challengeRating: number;
    timestamp: string;
    userId?: string;
    _userId?: string;
  },
  feedbackUrl?: string
): Promise<void> {
  try {
    const updateData: any = {
      feedback: feedback,
      updatedAt: Timestamp.now(),
    };

    if (feedbackUrl) {
      updateData.feedbackUrl = feedbackUrl;
    }

    // Check if session exists, if not create it
    const sessionRef = db.collection('gameplay_sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      // Session doesn't exist, create it with minimal data
      console.log(`[updateSessionFeedback] Session ${sessionId} does not exist, creating it...`);
      const userId = feedback.userId || feedback._userId || 'unknown';
      await sessionRef.set({
        sessionId,
        gameId,
        userId,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        completed: false,
        videoUrl: '',
        inputsUrl: '',
        metadataUrl: '',
        duration: 0,
        deviceInfo: {
          userAgent: '',
          screenWidth: 0,
          screenHeight: 0,
          ip: null,
        },
        ...updateData,
      });
    } else {
      // Session exists, update it
      await sessionRef.update(updateData);
    }

    console.log(`Updated session with feedback: ${sessionId} for game: ${gameId}`);
  } catch (error) {
    console.error('Error updating session feedback:', error);
    throw new Error(`Failed to update session feedback: ${error}`);
  }
}

export async function updateSessionWithProlificAndModel(
  sessionId: string,
  prolificId?: string | null,
  modelId?: string | null
): Promise<void> {
  try {
    const updateData: any = { updatedAt: Timestamp.now() };

    if (prolificId !== undefined) {
      updateData.prolificId = prolificId;
    }
    if (modelId !== undefined) {
      updateData.modelId = modelId;
    }

    if (Object.keys(updateData).length > 1) {
      await db.collection('gameplay_sessions').doc(sessionId).update(updateData);
      console.log(`Updated session with prolific/model: ${sessionId}`, { prolificId, modelId });
    }
  } catch (error) {
    console.error('Error updating session prolific/model:', error);
    throw new Error(`Failed to update session prolific/model: ${error}`);
  }
}
