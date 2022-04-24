/**
 * @file HTTP Proxy with Transform
 * @see https://deno.com/blog/deploy-streams#http-proxy-with-transform
 */

import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  url.protocol = "https:";
  url.hostname = "example.com";
  url.port = "443";
  const resp = await fetch(url.href);

  const bodyUpperCase = resp.body!
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(
      new TransformStream<string, string>({
        transform: (chunk, controller) => {
          // chunk 是单个很长的字符串——与 stdio 不同
          console.log(typeof chunk, chunk.length);
          console.log(Array.from(chunk));
          controller.enqueue(chunk.toUpperCase());
        },
      }),
    )
    .pipeThrough(new TextEncoderStream());

  return new Response(bodyUpperCase, {
    status: resp.status,
    headers: resp.headers,
  });
});

console.log("Listening on http://localhost:8000");
