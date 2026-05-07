// API Route: /api/experiment/next-participant-id
// POST - Get and increment the global participant counter

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

const COUNTER_DOC_ID = 'participant_counter';
const COUNTER_COLLECTION = 'experiment_config';

export async function POST() {
  try {
    const counterRef = db.collection(COUNTER_COLLECTION).doc(COUNTER_DOC_ID);

    // Use a transaction to safely increment the counter
    const participantId = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let currentCount = 0;
      if (counterDoc.exists) {
        currentCount = counterDoc.data()?.count || 0;
      }

      const nextCount = currentCount + 1;

      // Update the counter
      transaction.set(counterRef, {
        count: nextCount,
        lastUpdated: new Date().toISOString(),
      });

      return currentCount; // Return the ID for this participant (before increment)
    });

    console.log(`[Next Participant ID] Assigned ID: ${participantId}`);

    return NextResponse.json({
      success: true,
      participantId,
    });
  } catch (error) {
    console.error('[Next Participant ID] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get participant ID',
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
