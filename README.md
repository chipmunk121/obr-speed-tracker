# OBR Speed Tracker

A [Owlbear Rodeo](https://owlbear.rodeo) extension that tracks token movement speed — inspired by Foundry VTT's ruler behaviour.

## Features

- **Right-click any character token → Set Speed** to assign a speed in feet
- A custom **Speed Move tool** (press `M`) that shows a live colour-coded ruler while dragging:
  -  Green — plenty of movement left
  -  Yellow — approaching your limit (>75% used)
  -  Red — dashing (past speed, within 2× speed)
  -  Dark red — over dash limit
- Ruler label shows `feet moved (feet remaining / total speed)` and a `[DASHING]` tag
- Movement is **persistent across drags** within a turn — a token that used 20 of its 30 ft is tracked
- **Action panel** (top-left boot icon) lets the GM:
  - Configure feet per grid square (default 5 ft)
  - **Reset all movement** with one click at the start of a new round
  - See every speed-tracked token and how much movement they have left

## Install (for players/GMs)

1. Open your Owlbear Rodeo room
2. Click **Extras → Extensions → Add Extension**
3. Paste your manifest URL:
   ```
   https://<your-github-username>.github.io/obr-speed-tracker/manifest.json
   ```

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A GitHub account

### Local dev

```bash
git clone https://github.com/<you>/obr-speed-tracker
cd obr-speed-tracker
npm install
npm run dev
```

Vite will start on `http://localhost:5173`. Use [ngrok](https://ngrok.com/) or similar to get a public HTTPS URL so you can load it in OBR:

```bash
ngrok http 5173
# → https://abc123.ngrok.io
# Install URL: https://abc123.ngrok.io/manifest.json
```

### Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages** and set source to **GitHub Actions**
3. Push to `main` — the workflow builds and deploys automatically
4. Your manifest will be at:
   ```
   https://<username>.github.io/obr-speed-tracker/manifest.json
   ```

## How movement tracking works

Speed and used-movement are stored directly on each token's **metadata** in the scene, so they sync to all connected players instantly.

| Metadata key | Value |
|---|---|
| `rodeo.owlbear.speedtracker/speed` | Total speed in feet (number) |
| `rodeo.owlbear.speedtracker/used` | Feet spent this turn (number) |

The GM resets `used` to 0 for all tokens via the **Reset All Movement** button at the start of each round.

## Customisation

- **Feet per square**: Configurable in the action panel (defaults to 5 ft, standard D&D)
- **Extension ID**: Change `EXT_ID` in `src/constants.ts` if you publish under your own domain
- **Dash rules**: Edit the `rulerColor` and `labelText` functions in `src/moveTool.ts`

## License

MIT
