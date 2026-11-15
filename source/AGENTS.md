<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Health scoring, emergency scan model and strict routine live as pure functions in src/lib/astra/care.ts so they stay testable (src/test/care.test.ts).
- AI companion (Nova) calls go through a createServerFn in src/lib/astra/nova.functions.ts with the gateway call in nova.server.ts; keep the API key server-side.
- Emergency chat uses an AI SDK streaming server route and server-only gateway helpers; immediate reference protocols remain pure and testable so basic safety guidance never waits for AI.
- Emergency chat restores one UIMessage conversation from browser storage and persists completed turns; never attach profile or sensor data automatically to AI requests.
- Uploaded education documents are presented as dedicated reading routes using extracted content and CDN asset pointers; preserve original captions and distinguish source material from medical advice.
- Camera assessment uses a separate structured streaming server route; keep photographs ephemeral, strip upload metadata locally, and share only explicitly selected user chat text.
- Emergency image escalation and validation live in emergency-assessment.ts with concrete safety tests; never downgrade reported life-threatening symptoms from a photograph.
- Persist provider access denials in the server-only emergency_ai_access_guard table; it stores infrastructure status only, never medical inputs.
- Home's planet scene is lazy-loaded behind ClientOnly; textures and music use CDN pointers, and audio starts only on user interaction and stops when Home unmounts.
- The dev-only data-tsd-source injector is stripped from files importing @react-three/* in vite.config.ts, because R3F crashes on dashed props.
