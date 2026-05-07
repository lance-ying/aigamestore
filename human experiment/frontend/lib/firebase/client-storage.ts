// Firebase Storage Client-Side Upload Helpers
// Uploads files directly from the browser to Firebase Storage

import { storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface ClientUploadResult {
  videoUrl: string;
  inputsUrl: string;
  scoresUrl: string;
  metadataUrl: string;
  logsUrl?: string;
  ratingsUrl?: string;
  feedbackUrl?: string;
}

/**
 * Upload gameplay session files directly to Firebase Storage from the client
 * Path structure: games/{gameId}/user_sessions/{userId}/{sessionId}/
 */
export async function uploadSessionFilesClient(
  sessionId: string,
  userId: string,
  gameId: string,
  files: {
    video: Blob;
    inputs: Blob;
    scores: Blob;
    metadata: Blob;
    logs?: Blob;
    ratings?: Blob;
    feedback?: Blob;
  }
): Promise<ClientUploadResult> {
  const basePath = `games/${gameId}/user_sessions/${userId}/${sessionId}`;

  try {
    // Upload video
    const videoRef = ref(storage, `${basePath}/video.webm`);
    const videoSnapshot = await uploadBytes(videoRef, files.video, {
      contentType: 'video/webm',
      customMetadata: {
        sessionId,
        userId,
        gameId,
        uploadedAt: new Date().toISOString(),
      },
    });
    const videoUrl = await getDownloadURL(videoSnapshot.ref);

    // Upload inputs
    const inputsRef = ref(storage, `${basePath}/inputs.json`);
    const inputsSnapshot = await uploadBytes(inputsRef, files.inputs, {
      contentType: 'application/json',
      customMetadata: {
        sessionId,
        userId,
        gameId,
        uploadedAt: new Date().toISOString(),
      },
    });
    const inputsUrl = await getDownloadURL(inputsSnapshot.ref);

    // Upload scores
    const scoresRef = ref(storage, `${basePath}/scores.json`);
    const scoresSnapshot = await uploadBytes(scoresRef, files.scores, {
      contentType: 'application/json',
      customMetadata: {
        sessionId,
        userId,
        gameId,
        uploadedAt: new Date().toISOString(),
      },
    });
    const scoresUrl = await getDownloadURL(scoresSnapshot.ref);

    // Upload metadata
    const metadataRef = ref(storage, `${basePath}/metadata.json`);
    const metadataSnapshot = await uploadBytes(metadataRef, files.metadata, {
      contentType: 'application/json',
      customMetadata: {
        sessionId,
        userId,
        gameId,
        uploadedAt: new Date().toISOString(),
      },
    });
    const metadataUrl = await getDownloadURL(metadataSnapshot.ref);

    const result: ClientUploadResult = {
      videoUrl,
      inputsUrl,
      scoresUrl,
      metadataUrl,
    };

    // Upload logs if provided
    if (files.logs) {
      const logsRef = ref(storage, `${basePath}/logs.json`);
      const logsSnapshot = await uploadBytes(logsRef, files.logs, {
        contentType: 'application/json',
        customMetadata: {
          sessionId,
          userId,
          gameId,
          uploadedAt: new Date().toISOString(),
        },
      });
      result.logsUrl = await getDownloadURL(logsSnapshot.ref);
    }

    // Upload ratings if provided
    if (files.ratings) {
      const ratingsRef = ref(storage, `${basePath}/ratings.json`);
      const ratingsSnapshot = await uploadBytes(ratingsRef, files.ratings, {
        contentType: 'application/json',
        customMetadata: {
          sessionId,
          userId,
          gameId,
          uploadedAt: new Date().toISOString(),
        },
      });
      result.ratingsUrl = await getDownloadURL(ratingsSnapshot.ref);
    }

    // Upload feedback if provided
    if (files.feedback) {
      const feedbackRef = ref(storage, `${basePath}/feedback.json`);
      const feedbackSnapshot = await uploadBytes(feedbackRef, files.feedback, {
        contentType: 'application/json',
        customMetadata: {
          sessionId,
          userId,
          gameId,
          uploadedAt: new Date().toISOString(),
        },
      });
      result.feedbackUrl = await getDownloadURL(feedbackSnapshot.ref);
    }

    return result;
  } catch (error) {
    console.error('Error uploading session files to Firebase Storage:', error);
    throw new Error(`Failed to upload session files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload end-of-study feedback directly to Firebase Storage from the client
 * Path structure: end_study_feedback/{userId}/feedback.json
 */
export async function uploadEndStudyFeedbackClient(
  userId: string,
  feedbackData: {
    prolificId: string | null;
    feedback: {
      technicalIssues: string;
      confusingParts: string;
      suggestions: string;
      funCriteria: string;
    };
    demographics: {
      age: string;
      gender: string;
      gamingFrequency: string;
      gamingExperience: string;
    };
  }
): Promise<string> {
  const timestamp = new Date().toISOString();
  const basePath = `end_study_feedback/${userId}`;

  try {
    // Create feedback blob with timestamp
    const feedbackBlob = new Blob(
      [JSON.stringify({
        ...feedbackData,
        submittedAt: timestamp,
      }, null, 2)],
      { type: 'application/json' }
    );

    // Upload feedback
    const feedbackRef = ref(storage, `${basePath}/feedback.json`);
    const feedbackSnapshot = await uploadBytes(feedbackRef, feedbackBlob, {
      contentType: 'application/json',
      customMetadata: {
        userId,
        prolificId: feedbackData.prolificId || 'none',
        uploadedAt: timestamp,
      },
    });
    const feedbackUrl = await getDownloadURL(feedbackSnapshot.ref);

    console.log('[Client Storage] End-of-study feedback uploaded:', feedbackUrl);
    return feedbackUrl;
  } catch (error) {
    console.error('Error uploading end-of-study feedback to Firebase Storage:', error);
    throw new Error(`Failed to upload feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

