// API Route: /api/sessions/[sessionId]
// GET - Get a specific session
// DELETE - Delete a specific session

import { NextRequest, NextResponse } from 'next/server';
import { getSession, deleteSession, updateSessionScore } from '@/lib/firebase/firestore';
import { deleteSessionFiles, getSessionDownloadUrls } from '@/lib/firebase/storage';

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

// GET /api/sessions/[sessionId]
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`[Sessions] Fetching session ${sessionId}`);

    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Optionally include download URLs
    const includeUrls = request.nextUrl.searchParams.get('includeUrls') === 'true';
    let downloadUrls = null;

    if (includeUrls) {
      try {
        downloadUrls = await getSessionDownloadUrls(
          session.gameId,
          session.userId,
          sessionId
        );
      } catch (error) {
        console.warn(`[Sessions] Could not generate download URLs: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      session,
      downloadUrls,
    });
  } catch (error) {
    console.error('[Sessions] Error fetching session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch session',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[sessionId]
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`[Sessions] Deleting session ${sessionId}`);

    // First get the session to know gameId and userId
    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Delete files from Storage
    await deleteSessionFiles(session.gameId, session.userId, sessionId);

    // Delete Firestore record
    await deleteSession(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('[Sessions] Error deleting session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete session',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[sessionId] - Update session (e.g., score)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { score } = body;

    if (score === undefined || score === null) {
      return NextResponse.json(
        { success: false, error: 'Score is required' },
        { status: 400 }
      );
    }

    if (typeof score !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Score must be a number' },
        { status: 400 }
      );
    }

    console.log(`[Sessions] Updating score for session ${sessionId}: ${score}`);

    // Verify session exists
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    await updateSessionScore(sessionId, score);

    return NextResponse.json({
      success: true,
      message: 'Session score updated successfully',
      sessionId,
      score,
    });
  } catch (error) {
    console.error('[Sessions] Error updating session score:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update session score',
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
        'Access-Control-Allow-Methods': 'GET, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
