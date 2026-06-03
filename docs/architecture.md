> Agent context — not for human reading.

# Architecture — Helm

## Tech Stack (from tech-stack.md)

- **Language:** TypeScript (strict)
- **Desktop shell:** Electron
- **Frontend:** React + Tailwind CSS
- **State management:** Zustand
- **Build tool:** Vite
- **Local database:** SQLite via better-sqlite3
- **Claude engine:** @anthropic-ai/claude-agent-sdk (bring-your-own-subscription)
- **IPC:** Electron contextBridge + typed channels; Zod validates all messages
- **Distribution:** macOS .dmg via electron-builder + GitHub Releases
- **Testing:** Vitest (unit), Playwright with electron driver (E2E)

## Process Architecture

*(Updated per phase)*

## Data Model

*(Updated per phase)*

## Key Components

*(Updated per phase)*
