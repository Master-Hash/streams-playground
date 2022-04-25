/**
 * @file Realtime Log
 */
/** @jsxImportSource https://esm.sh/react */
import { serve } from "https://deno.land/std/http/server.ts";
import ReactDOMServer from "https://esm.sh/react-dom/server";

const child = Deno.spawnChild("C:\\Users\\90895\\AppData\\Local\\Microsoft\\WindowsApps\\genact.exe", {
  args: ["-m", "cargo"],
});

let [s, fuck] = child.stdout.tee();

serve(async (req) => {
  const u = new URL(req.url);
  if (u.pathname === "/sse") {
    // 黑魔法（
    // Stream 的设计就是不要在服务端缓存 ReadableStream
    // 这下全缓存了，唯一的好处是，实时输出
    let n;
    [s, n] = s.tee();
    const r = n
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(
        new TransformStream<string, string>({
          transform: (chunk, controller) => {
            // 理论上可行，但 genact 必须按照脚本样式输出，不能交互式输出
            controller.enqueue(`data: ${chunk}`);
          },
        }),
      )
      .pipeThrough(new TextEncoderStream());
    return new Response(r, {
      headers: {
        "Content-Type": "text/event-stream",
      },
    });

  }
  else if (u.pathname === "/js") {
    return new Response(`const evtSource = new EventSource('/sse');
const eventList = document.querySelector('ul');
evtSource.addEventListener('message', function(e) {
  console.log(e.data);
  const newElement = document.createElement("li");

  newElement.textContent = "message: " + e.data;
  eventList.appendChild(newElement);
});
`, { headers: { 'Content-Type': 'text/javascript' } });
  }
  else {
    // @ts-ignore no type provided upstream
    const stream = await ReactDOMServer.renderToReadableStream(
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Realtime Stream</title>
        </head>
        <body>
          <main>
            <h1>
              Realtime Log
            </h1>
            <ul />
          </main>
          <script type="module" src="/js" />
        </body>
      </html>
    );
    await stream.allReady;
    return new Response(stream, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
});

console.log("View page on http://localhost:8000/");

// fuck
//   .pipeThrough(new TextDecoderStream())
//   .pipeThrough(
//     new TransformStream<string, string>({
//       transform: (chunk, controller) => {
//         console.log(Array.from(chunk));
//         controller.enqueue(`${chunk}`);
//       },
//     }),
//   )
//   .pipeThrough(new TextEncoderStream())
//   .pipeTo(Deno.stdout.writable);
