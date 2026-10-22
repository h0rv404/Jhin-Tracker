# Jhin Tracker

A personal League of Legends tracker for comparing Jhin strategies across multiple accounts.

- **Original tracker:** https://h0rv404.github.io/Jhin-Tracker/
- **Jhin Atelier (new hosted version):** https://jhin-atelier-horu.bushyskunk15.chatgpt.site
- **Full new application source:** [`atelier/`](atelier/README.md)

The original root `index.html` remains the GitHub Pages entry point. The new application is kept in `atelier/` so the original site remains available while the new version is reviewed.

## What the new version includes

- Account links and on-demand Riot match imports.
- Champion selectors and saved visual rune pages.
- Strategy comparisons, sessions, match corrections, rank checkpoints and JSON backups.
- An authenticated backend that stores API keys encrypted on the server.

GitHub stores the source; GitHub Pages alone cannot run the Riot sync backend. Use the hosted link above for the complete version. Uploading or merging this source does not automatically redeploy that hosted application.

For local setup, API key configuration and migration from the original tracker, see [`atelier/README.md`](atelier/README.md). Never commit a real Riot API key or local environment file. Game records are browser-local; export a backup before switching sites or browsers.
