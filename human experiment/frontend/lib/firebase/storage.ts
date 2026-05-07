// Firebase Storage Upload Helpers
// Server-side utilities for uploading files to Firebase Storage

import { storage } from './admin';
import { SessionMetadata } from '../types/gameplay';

export interface UploadResult {
  videoUrl: string;
  inputsUrl: string;
  metadataUrl: string;
  logsUrl?: string;
  ratingsUrl?: string;
}

/**
 * Upload gameplay session files to Firebase Storage
 * Path structure: games/{gameId}/user_sessions/{userId}/{sessionId}/
 */
export async function uploadSessionFiles(
  sessionId: string,
  userId: string,
  gameId: string,
  files: {
    video: Buffer;
    inputs: Buffer;
    metadata: Buffer;
    logs?: Buffer;
    ratings?: Buffer;
  }
): Promise<UploadResult> {
  const bucket = storage.bucket();
  const basePath = `games/${gameId}/user_sessions/${userId}/${sessionId}`;

  try {
    // Upload video
    const videoPath = `${basePath}/video.webm`;
    const videoFile = bucket.file(videoPath);
    await videoFile.save(files.video, {
      contentType: 'video/webm',
      metadata: {
        metadata: {
          sessionId,
          userId,
          gameId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Upload inputs
    const inputsPath = `${basePath}/inputs.json`;
    const inputsFile = bucket.file(inputsPath);
    await inputsFile.save(files.inputs, {
      contentType: 'application/json',
      metadata: {
        metadata: {
          sessionId,
          userId,
          gameId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Upload metadata
    const metadataPath = `${basePath}/metadata.json`;
    const metadataFile = bucket.file(metadataPath);
    await metadataFile.save(files.metadata, {
      contentType: 'application/json',
      metadata: {
        metadata: {
          sessionId,
          userId,
          gameId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Upload logs if provided
    let logsUrl: string | undefined;
    if (files.logs) {
      const logsPath = `${basePath}/logs.json`;
      const logsFile = bucket.file(logsPath);
      await logsFile.save(files.logs, {
        contentType: 'application/json',
        metadata: {
          metadata: {
            sessionId,
            userId,
            gameId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });
      logsUrl = `gs://${bucket.name}/${logsPath}`;
    }

    // Upload ratings if provided
    let ratingsUrl: string | undefined;
    if (files.ratings) {
      const ratingsPath = `${basePath}/ratings.json`;
      const ratingsFile = bucket.file(ratingsPath);
      await ratingsFile.save(files.ratings, {
        contentType: 'application/json',
        metadata: {
          metadata: {
            sessionId,
            userId,
            gameId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });
      ratingsUrl = `gs://${bucket.name}/${ratingsPath}`;
    }

    // Return Storage URLs
    const result: UploadResult = {
      videoUrl: `gs://${bucket.name}/${videoPath}`,
      inputsUrl: `gs://${bucket.name}/${inputsPath}`,
      metadataUrl: `gs://${bucket.name}/${metadataPath}`,
    };

    if (logsUrl) {
      result.logsUrl = logsUrl;
    }

    if (ratingsUrl) {
      result.ratingsUrl = ratingsUrl;
    }

    return result;
  } catch (error) {
    console.error('Error uploading session files:', error);
    throw new Error(`Failed to upload session files: ${error}`);
  }
}

/**
 * Delete all files for a specific session
 */
export async function deleteSessionFiles(
  gameId: string,
  userId: string,
  sessionId: string
): Promise<void> {
  const bucket = storage.bucket();
  const basePath = `games/${gameId}/user_sessions/${userId}/${sessionId}`;

  try {
    const [files] = await bucket.getFiles({ prefix: basePath });
    await Promise.all(files.map(file => file.delete()));
    console.log(`Deleted ${files.length} files for session ${sessionId}`);
  } catch (error) {
    console.error('Error deleting session files:', error);
    throw new Error(`Failed to delete session files: ${error}`);
  }
}

/**
 * Delete all files for a specific user (GDPR compliance)
 */
export async function deleteUserFiles(userId: string): Promise<void> {
  const bucket = storage.bucket();

  try {
    // Find all files for this user across all games
    const [files] = await bucket.getFiles({
      prefix: `games/`,
    });

    const userFiles = files.filter(file =>
      file.name.includes(`/user_sessions/${userId}/`)
    );

    await Promise.all(userFiles.map(file => file.delete()));
    console.log(`Deleted ${userFiles.length} files for user ${userId}`);
  } catch (error) {
    console.error('Error deleting user files:', error);
    throw new Error(`Failed to delete user files: ${error}`);
  }
}

/**
 * Get download URLs for session files (signed URLs valid for 1 hour)
 */
export async function getSessionDownloadUrls(
  gameId: string,
  userId: string,
  sessionId: string
): Promise<{
  videoUrl: string;
  inputsUrl: string;
  metadataUrl: string;
}> {
  const bucket = storage.bucket();
  const basePath = `games/${gameId}/user_sessions/${userId}/${sessionId}`;

  try {
    const videoFile = bucket.file(`${basePath}/video.webm`);
    const inputsFile = bucket.file(`${basePath}/inputs.json`);
    const metadataFile = bucket.file(`${basePath}/metadata.json`);

    // Generate signed URLs valid for 1 hour
    const expiresIn = 3600000; // 1 hour in ms
    const expires = Date.now() + expiresIn;

    const [videoUrl] = await videoFile.getSignedUrl({
      action: 'read',
      expires,
    });

    const [inputsUrl] = await inputsFile.getSignedUrl({
      action: 'read',
      expires,
    });

    const [metadataUrl] = await metadataFile.getSignedUrl({
      action: 'read',
      expires,
    });

    return { videoUrl, inputsUrl, metadataUrl };
  } catch (error) {
    console.error('Error generating download URLs:', error);
    throw new Error(`Failed to generate download URLs: ${error}`);
  }
}

/**
 * List all sessions for a specific game
 */
export async function listGameSessions(gameId: string): Promise<string[]> {
  const bucket = storage.bucket();
  const prefix = `games/${gameId}/user_sessions/`;

  try {
    const [files] = await bucket.getFiles({ prefix });

    // Extract unique sessionIds from file paths
    const sessionIds = new Set<string>();
    files.forEach(file => {
      // Path format: games/{gameId}/user_sessions/{userId}/{sessionId}/file.ext
      const parts = file.name.split('/');
      if (parts.length >= 5) {
        sessionIds.add(parts[4]);
      }
    });

    return Array.from(sessionIds);
  } catch (error) {
    console.error('Error listing game sessions:', error);
    throw new Error(`Failed to list game sessions: ${error}`);
  }
}

/**
 * List all users who played a specific game
 */
export async function listGameUsers(gameId: string): Promise<string[]> {
  const bucket = storage.bucket();
  const prefix = `games/${gameId}/user_sessions/`;

  try {
    const [files] = await bucket.getFiles({ prefix });

    // Extract unique userIds from file paths
    const userIds = new Set<string>();
    files.forEach(file => {
      // Path format: games/{gameId}/user_sessions/{userId}/{sessionId}/file.ext
      const parts = file.name.split('/');
      if (parts.length >= 4) {
        userIds.add(parts[3]);
      }
    });

    return Array.from(userIds);
  } catch (error) {
    console.error('Error listing game users:', error);
    throw new Error(`Failed to list game users: ${error}`);
  }
}
