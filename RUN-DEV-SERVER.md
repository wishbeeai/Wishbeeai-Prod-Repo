# How to Run the Dev Server

The app runs at **http://127.0.0.1:3001**.

## Prerequisites

- **Node.js LTS** must be installed and on your PATH.
  - Install: https://nodejs.org (LTS) or `winget install OpenJS.NodeJS.LTS`
  - After installing, **restart Cursor** (or your terminal) so `node` and `npm` are found.

## Steps

1. Open a terminal in the project folder.
2. Install dependencies (first time only):
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. When you see `Ready on http://127.0.0.1:3001`, open that URL in your browser.

## Troubleshooting

- **"npm is not recognized"** → Node.js not installed or not in PATH. Install Node.js LTS, then **restart Cursor**.
- **"next is not recognized"** → Run `npm install` in the project folder, then try again. Use a **new** terminal (e.g. Windows Terminal or Command Prompt) opened **outside** Cursor if it still fails.
- **`spawn EPERM`** or **`ERR_CONNECTION_REFUSED`** → The project is in **OneDrive** (`Desktop\...`). OneDrive can block Node from spawning processes.
  - **Option A:** Move the project to a non‑synced folder (e.g. `C:\dev\Wishbeeai-Prod`), run `npm install`, then `npm run dev`.
  - **Option B:** Run `npm run dev` from **Windows Terminal** or **Command Prompt** (not Cursor’s terminal), and keep that window open.
- **Port 3001 in use** → Stop any other process using 3001, or change the port in `package.json` (`"dev": "next dev --hostname 127.0.0.1 -p 3002"` etc.).
