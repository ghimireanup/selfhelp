# SelfHelp

A tiny full-stack app for tracking the things that do you good. Write down a
good deed, check it off when it's done, and watch your **Success Score** climb.
The score is a cumulative lifetime total — the more you complete, the higher it
goes.

## Features

- Add good deeds with an optional note and a difficulty (Easy +1, Medium +3, Hard +5).
- Check a deed off to earn its points; it moves to the **Done** list.
- A big **Success Score** with level badges: Getting Started → On a Roll →
  Committed → Champion.
- Data is stored server-side in SQLite, so it persists across restarts and
  browsers.

## Tech

- **Backend:** Node.js + Express REST API (`server.js`)
- **Database:** SQLite via `better-sqlite3` (`db.js`, file `selfhelp.db`)
- **Frontend:** static HTML/CSS/vanilla JS in `public/` (no build step)

## Run it

```bash
npm install
npm start
```

Then open http://localhost:3000.

Set `PORT` to change the port and `SELFHELP_DB` to change the database file
location.

## API

| Method | Path             | Description                                  |
| ------ | ---------------- | -------------------------------------------- |
| GET    | `/api/deeds`     | List all deeds (newest first) + current score |
| POST   | `/api/deeds`     | Create a deed `{ title, description?, points? }` |
| PATCH  | `/api/deeds/:id` | Toggle completion                            |
| DELETE | `/api/deeds/:id` | Delete a deed                                |
