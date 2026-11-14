# CC

A small home-screen web app with two daily habits:

- **The Switzerland Protocol**: a word a day (noun or adjective) with an example sentence, in English, French, German and Italian.
- **Ab Bandit**: a one-armed bandit that picks three ab exercises a day, with 3 nudges.

Streaks are stored locally on the device.

## Develop

    npm install
    npm run dev

Add `?date=YYYY-MM-DD` to the URL to preview another day.

## Deploy

Pushing to `main` builds and publishes to GitHub Pages (`.github/workflows/deploy.yml`).

## Content

- Words: `src/data/words1.js` … `words4.js` (365 entries; day one is 14 November 2026)
- Exercises: `src/data/exercises.js` (3 reels × 20)
