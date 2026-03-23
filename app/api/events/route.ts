import { emitter } from '@/lib/emitter';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new Response('User ID is required', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const listener = (eventUserId: string) => {
        if (eventUserId === userId) {
          try {
            controller.enqueue(`data: update\n\n`);
          } catch (e) {}
        }
      };

      emitter.on('update_received', listener);

      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(`:\n\n`);
        } catch (e) {
          clearInterval(pingInterval);
        }
      }, 20000);

      req.signal.addEventListener('abort', () => {
        emitter.off('update_received', listener);
        clearInterval(pingInterval);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
