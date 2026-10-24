import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string[] }> }
) {
  try {
    const { gameId: gameIdArray } = await params;
    // Join the array to reconstruct the full path
    const gameId = gameIdArray.join('/');

    // In Vercel serverless, we need to fetch from the static file URL
    // The public folder is served as static files, not accessible via filesystem in serverless
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    // gameId already includes the full path like games_pilot/method/game_XXXX/sample_0
    const staticFileUrl = `${origin}/${gameId}/index.html`;

    let htmlContent: string;
    
    // Try fetching from static files first (works in production/Vercel)
    try {
      const response = await fetch(staticFileUrl, {
        // Use cache to avoid infinite loops, but allow fresh fetches
        cache: 'no-store',
      });
      
      if (!response.ok) {
        // Fallback: Try reading from filesystem (works in dev and some environments)
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.default.join(
          process.cwd(),
          'public',
          gameId,
          'index.html'
        );
        htmlContent = await fs.readFile(filePath, 'utf-8');
      } else {
        htmlContent = await response.text();
      }
    } catch (error) {
      // Final fallback: filesystem read
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.default.join(
          process.cwd(),
          'public',
          gameId,
          'index.html'
        );
        htmlContent = await fs.readFile(filePath, 'utf-8');
      } catch (fsError) {
        throw new Error(`Failed to load game: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Fix relative paths by injecting a base tag
    // gameId already contains the full path
    const modifiedHtml = htmlContent.replace(
      '<head>',
      `<head>
    <base href="/${gameId}/">`
    );

    // Return as HTML response
    return new NextResponse(modifiedHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error reading game file:', error);
    return new NextResponse('Game not found', { status: 404 });
  }
}
