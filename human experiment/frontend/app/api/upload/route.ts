// API Route: POST /api/upload
// Uploads gameplay session files (video, inputs, metadata) to Firebase Storage

import { NextRequest, NextResponse } from 'next/server';
import { uploadSessionFiles } from '@/lib/firebase/storage';
import { updateSessionWithFiles, updateSessionScore, updateSessionScoreTimeSeries, updateSessionWithProlificAndModel } from '@/lib/firebase/firestore';
import { ScoreDataPoint } from '@/lib/types/gameplay';

// Increase body size limit for large video uploads
// Note: Vercel free tier has a 4.5MB limit, Pro/Enterprise allows up to 50MB
export const maxDuration = 60; // 60 seconds max execution time
export const runtime = 'nodejs'; // Use Node.js runtime for better file handling

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload] Starting upload...');
    const formData = await request.formData();

    // Extract form fields
    const sessionId = formData.get('sessionId') as string;
    const userId = formData.get('userId') as string;
    const gameId = formData.get('gameId') as string;
    const prolificId = formData.get('prolificId') as string | null;
    const modelId = formData.get('modelId') as string | null;
    const videoFile = formData.get('video') as File;
    const inputsFile = formData.get('inputs') as File;
    const metadataFile = formData.get('metadata') as File;
    const logsFile = formData.get('logs') as File | null;
    const ratingsFile = formData.get('ratings') as File | null;

    console.log('[Upload] Form data received:', { sessionId, userId, gameId, prolificId, modelId, hasVideo: !!videoFile, hasInputs: !!inputsFile, hasMetadata: !!metadataFile, hasLogs: !!logsFile, hasRatings: !!ratingsFile });

    // Validate required fields
    if (!sessionId || !userId || !gameId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sessionId, userId, or gameId' },
        { status: 400 }
      );
    }

    if (!videoFile || !inputsFile || !metadataFile) {
      return NextResponse.json(
        { success: false, error: 'Missing required files: video, inputs, or metadata' },
        { status: 400 }
      );
    }

    // Convert files to Buffers
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    const inputsBuffer = Buffer.from(await inputsFile.arrayBuffer());
    const metadataBuffer = Buffer.from(await metadataFile.arrayBuffer());
    const logsBuffer = logsFile ? Buffer.from(await logsFile.arrayBuffer()) : null;
    const ratingsBuffer = ratingsFile ? Buffer.from(await ratingsFile.arrayBuffer()) : null;

    console.log(`[Upload] Uploading session ${sessionId} for user ${userId}, game ${gameId}`);
    console.log(`[Upload] File sizes - video: ${videoBuffer.length}, inputs: ${inputsBuffer.length}, metadata: ${metadataBuffer.length}, logs: ${logsBuffer?.length || 0}, ratings: ${ratingsBuffer?.length || 0}`);

    // Upload files to Firebase Storage
    console.log('[Upload] Calling uploadSessionFiles...');
    const uploadFiles: any = {
      video: videoBuffer,
      inputs: inputsBuffer,
      metadata: metadataBuffer,
    };

    if (logsBuffer) {
      uploadFiles.logs = logsBuffer;
    }

    if (ratingsBuffer) {
      uploadFiles.ratings = ratingsBuffer;
    }

    const urls = await uploadSessionFiles(sessionId, userId, gameId, uploadFiles);
    console.log('[Upload] Upload complete, URLs:', urls);

    // Parse metadata to extract device info
    const metadataJson = JSON.parse(metadataBuffer.toString('utf-8'));

    // Extract device info from metadata (use nested deviceInfo if available, otherwise fall back to top-level fields)
    const extractedDeviceInfo = metadataJson.deviceInfo || {};
    const deviceInfo = {
      userAgent: extractedDeviceInfo.userAgent || metadataJson.userAgent || '',
      screenWidth: extractedDeviceInfo.screenWidth || metadataJson.screenWidth || 0,
      screenHeight: extractedDeviceInfo.screenHeight || metadataJson.screenHeight || 0,
      screenDepth: extractedDeviceInfo.screenDepth,
      screenPixelDepth: extractedDeviceInfo.screenPixelDepth,
      devicePixelRatio: extractedDeviceInfo.devicePixelRatio,
      timezone: extractedDeviceInfo.timezone,
      language: extractedDeviceInfo.language,
      hardwareConcurrency: extractedDeviceInfo.hardwareConcurrency,
      deviceMemory: extractedDeviceInfo.deviceMemory,
      maxTouchPoints: extractedDeviceInfo.maxTouchPoints,
      platform: extractedDeviceInfo.platform,
      vendor: extractedDeviceInfo.vendor,
      ip: extractedDeviceInfo.ip || null,
    };

    // Parse inputs to extract score and score time series if present
    const inputsJson = JSON.parse(inputsBuffer.toString('utf-8'));
    const score = inputsJson.score || null;
    const scoreTimeSeries = inputsJson.scoreTimeSeries || null;
    console.log('[Upload] Parsed inputs, found score:', score, 'type:', typeof score);
    console.log('[Upload] Parsed inputs, found scoreTimeSeries:', scoreTimeSeries ? `${scoreTimeSeries.length} data points` : 'none');

    // Update Firestore record with URLs and metadata
    console.log('[Upload] Updating Firestore record...');
    await updateSessionWithFiles(
      sessionId,
      urls,
      {
        duration: metadataJson.duration || 0,
        deviceInfo,
      }
    );
    console.log('[Upload] Firestore updated');

    // Update prolific and model IDs if present
    if (prolificId || modelId) {
      console.log('[Upload] ✓ Updating session with prolific/model:', { prolificId, modelId });
      await updateSessionWithProlificAndModel(sessionId, prolificId, modelId);
      console.log('[Upload] ✓ Prolific/model IDs saved to Firestore');
    }

    // Update score if present
    if (score !== null && typeof score === 'number') {
      console.log('[Upload] ✓ Updating session score:', score);
      await updateSessionScore(sessionId, score);
      console.log('[Upload] ✓ Score saved to Firestore');
    } else {
      console.warn('[Upload] ✗ Score not found or invalid:', score);
    }

    // Update score time series if present
    if (scoreTimeSeries && Array.isArray(scoreTimeSeries) && scoreTimeSeries.length > 0) {
      console.log('[Upload] ✓ Updating session score time series:', scoreTimeSeries.length, 'data points');
      await updateSessionScoreTimeSeries(sessionId, scoreTimeSeries as ScoreDataPoint[]);
      console.log('[Upload] ✓ Score time series saved to Firestore');
    } else {
      console.log('[Upload] No score time series to save');
    }

    console.log(`[Upload] Successfully uploaded session ${sessionId}`);

    return NextResponse.json({
      success: true,
      urls,
      message: 'Session files uploaded successfully',
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    
    // Check if it's a payload size error
    if (error instanceof Error && (error.message.includes('413') || error.message.includes('too large') || error.message.includes('PayloadTooLarge'))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Upload failed: File size too large. Video recordings may exceed the server limit. Please try a shorter recording or contact support.',
          code: 'PAYLOAD_TOO_LARGE',
        },
        { status: 413 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
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
