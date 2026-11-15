# ASTRA — Standalone Offline Edition

ASTRA (Advanced Space Traveller Regulation & Assessment) is a browser-based astronaut health-monitoring and mission simulation demo. This repository includes a prebuilt standalone edition that runs locally without application dependencies or an internet connection.

> **Demonstration only:** ASTRA is not a medical device and does not provide medical advice, diagnosis, or treatment. Its readings and scenarios are simulated; do not use them for real health or flight decisions.

## Run the standalone app

The prebuilt web app is in `dist/`. The local server requires Node.js 18 or newer and has no npm dependencies.

1. Install Node.js 18+ from [nodejs.org](https://nodejs.org).
2. From the repository root, run the installer and launcher for your platform:

   - **Windows:** double-click `install.bat`, then `start.bat`.
   - **macOS/Linux:** run `./install.sh`, then `./start.sh`.

3. Open <http://localhost:8080>. Stop the server with `stop.bat` (Windows) or `./stop.sh` (macOS/Linux), or press Ctrl+C in the server terminal.

To use another port, set `PORT` before launching (`set PORT=9000` in Windows Command Prompt or `PORT=9000 ./start.sh` on macOS/Linux).

## Offline demo

Choose **Launch Offline Demo** from the home page or open the Offline Demo Mode panel in Mission Control. The simulation includes astronaut profiles, mission environments, adjustable speed, and several scenarios. Demo readings and scenarios are simulated, and the interface marks demonstration data.

The GitHub Pages edition uses a local, rule-based demonstration assistant for Nova and Emergency chat, even when online. The prebuilt standalone edition uses the demonstration assistant when the browser is offline. The assistant is not AI and does not provide medical advice. Full AI chat and camera assessment require a separately hosted server and configured AI provider; they are not available in the static editions. Data used by the standalone offline demo is stored in this browser on this device.

## Develop and validate

The application source and Bun lockfile are in `source/`. Development requires [Bun](https://bun.sh/).

```sh
cd source
bun install --frozen-lockfile
bun run dev
```

Run the same checks as GitHub Actions from `source/`:

```sh
bun run test
```

Build the standalone-configured source app with `ASTRA_STANDALONE=1 bun run build` (in PowerShell: `$env:ASTRA_STANDALONE = "1"; bun run build`). GitHub Actions runs tests and this build on pushes and pull requests. `bun run lint` is also available, but the current source has existing lint violations. The checked-in `dist/` is the separately packaged web bundle served by the root `server.mjs`.

## Data and assets

In the offline demo, browser-local settings, checkups, readings, and chat history stay in local browser storage. Online features may send the information explicitly submitted to their service; do not enter sensitive personal or medical information.

Audio and texture credits are shown in the app. Refer to the source under `source/` for the application implementation, tests, and asset metadata.
