# ASTRA — Standalone Offline Edition

ASTRA (Advanced Space Traveller Regulation & Assessment) is an astronaut
health-monitoring application. This package is a **fully independent, offline-capable
build** that runs on your own laptop with no internet connection and no Lovable account.

---

## 1. What you need

- **Windows 10/11 or macOS** (Apple Silicon or Intel)
- **Node.js 18 or newer** — download once from <https://nodejs.org> (needs internet, once)
- Nothing else. The app is pre-built; the local server has zero dependencies.

## 2. Install

**Windows:** double-click `install.bat`
**macOS:** open Terminal in this folder and run `./install.sh`

The installer only checks that Node.js is present. There is nothing to download.

## 3. Start

**Windows:** double-click `start.bat`
**macOS:** run `./start.sh`

Your browser opens at <http://localhost:8080>. To use a different port:
`PORT=9000 ./start.sh` (macOS) or `set PORT=9000` before `start.bat` (Windows).

## 4. Stop

**Windows:** double-click `stop.bat` (or close the server window)
**macOS:** run `./stop.sh` (or press Ctrl+C in the server terminal)

## 5. Offline presentation mode (committee demo)

1. Start the app with the script above — **internet is not required**.
   You can enable airplane mode; everything keeps working.
2. On the Home page click **Launch Offline Demo**, or open Mission Control and use the
   **Offline Demo Mode** panel.
3. The panel lets you:
   - **Start / Pause / Reset** the local simulation engine
   - Change **simulation speed** (0.5×–4×)
   - Switch between three **astronaut profiles**
   - Switch **mission environments** (spacecraft, ISS, lunar surface, Mars habitat)
   - Run **scenarios**: nominal operations, EVA exertion, developing illness, emergency drill
4. Dashboards, charts, live waveforms, alerts and navigation all update from the
   simulated data. A banner marks everything as **DEMONSTRATION DATA**.
5. The Emergency AI Guide and Nova wellbeing chat automatically switch to a clearly
   labelled **offline demonstration assistant** (rule-based, local knowledge) when
   there is no internet. It is not a real AI and never gives medical diagnoses.

## 6. Where data lives

All data (settings, checkups, readings, chat history, simulation settings) is stored
**in the browser on this laptop only** (localStorage). Nothing is sent anywhere in
offline mode. Closing and reopening the app keeps your data. Clearing the browser's
site data resets the app.

## 7. Troubleshooting

| Problem | Fix |
| --- | --- |
| "Node.js is required" | Install Node.js 18+ from nodejs.org, then rerun install |
| Browser says "can't connect" | Make sure the server window is still open; check the port in the startup message |
| Port 8080 already in use | Start with a different port (see section 3) |
| Page looks blank after an update | Hard-refresh with Ctrl+F5 (Windows) or Cmd+Shift+R (macOS) |
| Music doesn't start | Browsers block autoplay; click anywhere on the page once |
| AI chat says "offline demonstration assistant" | Expected without internet — the full AI needs a connection |

## 8. Virtual machines

The package works in any Windows 10/11 or macOS virtual machine (VMware, VirtualBox,
Parallels, Hyper-V) that can run Node.js 18+. Copy the ZIP into the VM, extract,
install Node.js, and use the scripts as above. No special VM settings are needed.

## 9. What is online-only

These features need an internet connection and degrade gracefully offline:

- **Nova AI wellbeing chat** and **Emergency AI Guide** → replaced by the labelled
  offline demonstration assistant
- **Camera emergency assessment** (AI image analysis) → the emergency protocols and
  offline assistant remain available
- Links to external references (NASA, Red Cross, NHS) in the Education Centre

Everything else — dashboards, charts, simulation, checkups, routines, alerts,
education content, 3D graphics, music — is fully local.

## 10. Package contents

```
server.mjs          local zero-dependency web server (Node 18+)
dist/client/        the complete pre-built application (HTML, JS, CSS, fonts,
                    images, 3D models, music — all bundled locally)
install.bat/.sh     dependency check
start.bat/.sh       launch the app and open the browser
stop.bat/.sh        stop the app
README.md           this file
```
