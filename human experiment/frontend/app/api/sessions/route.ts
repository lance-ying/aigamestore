// API Route: /api/sessions
// POST - Create a new gameplay session
// GET - List sessions (with optional filters)

import { NextRequest, NextResponse } from 'next/server';
import { createSession, getGameSessions, getUserSessions } from '@/lib/firebase/firestore';
import { upsertUser } from '@/lib/firebase/firestore';

// POST /api/sessions - Create a new gameplay session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gameId, prolificId, modelId } = body;

    // Validate required fields
    if (!userId || !gameId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId or gameId' },
        { status: 400 }
      );
    }

    // Generate session ID with timestamp
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const sessionId = `session_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;

    console.log(`[Sessions] Creating session ${sessionId} for user ${userId}, game ${gameId}${prolificId ? `, prolific ${prolificId}` : ''}${modelId ? `, model ${modelId}` : ''}`);

    // Create session record in Firestore with prolific and model info
    await createSession(sessionId, userId, gameId, undefined, prolificId, modelId);

    // Upsert user record (create if not exists, update lastActiveAt)
    await upsertUser(userId, gameId);

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Session created successfully',
    });
  } catch (error) {
    console.error('[Sessions] Error creating session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create session',
      },
      { status: 500 }
    );
  }
}

// GET /api/sessions?userId=xxx or ?gameId=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const gameId = searchParams.get('gameId');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!userId && !gameId) {
      return NextResponse.json(
        { success: false, error: 'Must provide either userId or gameId parameter' },
        { status: 400 }
      );
    }

    let sessions: any[] = [];
    if (userId) {
      console.log(`[Sessions] Fetching sessions for user ${userId}`);
      sessions = await getUserSessions(userId, limit);
    } else if (gameId) {
      console.log(`[Sessions] Fetching sessions for game ${gameId}`);
      sessions = await getGameSessions(gameId, limit);
    }

    return NextResponse.json({
      success: true,
      sessions,
      total: sessions?.length || 0,
    });
  } catch (error) {
    console.error('[Sessions] Error fetching sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sessions',
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
