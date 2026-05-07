// API Route: POST /api/sessions/update
// Updates Firestore session record with uploaded file URLs and metadata
// This is called after files are uploaded directly to Firebase Storage from the client

import { NextRequest, NextResponse } from 'next/server';
import { updateSessionWithFiles, updateSessionScore, updateSessionScoreTimeSeries, updateSessionWithProlificAndModel, updateSessionFeedback } from '@/lib/firebase/firestore';
import { DeviceInfo, ScoreDataPoint } from '@/lib/types/gameplay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, urls, metadata, score, scoreTimeSeries, prolificId, modelId, feedback, feedbackUrl, gameId } = body;

    // Validate required fields - sessionId is always required
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }

    console.log(`[Sessions/Update] Updating session ${sessionId}`);

    // Update Firestore with file URLs and metadata (only if provided)
    if (urls && metadata) {
      await updateSessionWithFiles(
        sessionId,
        {
          videoUrl: urls.videoUrl,
          inputsUrl: urls.inputsUrl,
          scoresUrl: urls.scoresUrl,
          metadataUrl: urls.metadataUrl,
        },
        {
          duration: metadata.duration || 0,
          deviceInfo: metadata.deviceInfo as DeviceInfo,
        }
      );
    }

    // Update prolific and model IDs if present
    if (prolificId || modelId) {
      await updateSessionWithProlificAndModel(sessionId, prolificId, modelId);
    }

    // Update score if present
    if (score !== null && typeof score === 'number') {
      await updateSessionScore(sessionId, score);
    }

    // Update score time series if present
    if (scoreTimeSeries && Array.isArray(scoreTimeSeries) && scoreTimeSeries.length > 0) {
      await updateSessionScoreTimeSeries(sessionId, scoreTimeSeries as ScoreDataPoint[]);
    }

    // Update feedback if present (this can be called independently)
    if (feedback && gameId) {
      await updateSessionFeedback(sessionId, gameId, feedback, feedbackUrl);
    }

    console.log(`[Sessions/Update] Successfully updated session ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
    });
  } catch (error) {
    console.error('[Sessions/Update] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update session',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

