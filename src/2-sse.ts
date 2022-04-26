/**
 * @file Server-Sent Events
 * @see https://deno.com/blog/deploy-streams#server-sent-events
 */

import { serve } from "https://deno.land/std/http/server.ts";

const msg = new TextEncoder().encode(`data: It is ${new Date().toISOString()}\r\n`);

serve(() => {
  const body = createTimerStream();
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
});

console.log("Listening on http://localhost:8000");

function createTimerStream() {
  let timerId: number | undefined;
  const body = new ReadableStream({
    start(controller) {
      timerId = setInterval(() => {
        controller.enqueue(msg);
      }, 1000);
    },
    cancel() {
      if (typeof timerId === "number") {
        clearInterval(timerId);
      }
    },
  });
  return body;
}
