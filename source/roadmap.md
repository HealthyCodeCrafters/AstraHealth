# Roadmap — Standalone Offline Package

Decisions: Node.js local server · browser storage · rule-based AI fallback offline · test Windows + macOS scripts equally.

## Tasks
- [x] Map network dependencies (fonts, CDN assets, Supabase, AI gateway calls)
- [x] Local simulation engine (vitals generator, profiles, environments, speed/start/pause/reset)
- [x] Simulation control panel + Offline Demo Mode entry point
- [x] Wire simulated data into dashboards/charts with "DEMONSTRATION DATA" labels
- [x] Rule-based offline assistant fallback for Nova + emergency chat (clearly labelled)
- [x] Bundle/self-host external assets (fonts via @fontsource, CDN files in public/offline-assets/)
- [x] Local server + install/start/stop scripts (install.bat/start.bat/stop.bat, install.sh/start.sh/stop.sh)
- [x] README, troubleshooting, VM + offline presentation instructions
- [x] Build ZIP package to /mnt/documents/astra-standalone.zip
- [x] Offline verification test (external network blocked: home, dashboard, live sim readings, chat fallback, persistence all pass)

## Notes
- Windows .bat scripts are written but could not be executed in this Linux sandbox; macOS/Linux path (server.mjs + .sh logic) verified end-to-end.
- Prerender of mission routes is blocked by the sandbox build wrapper (maxRedirects pinned to 0), so the static server serves the prerendered "/" shell with SPA fallback; verified working, one benign React hydration console warning (#418) may appear in devtools.
