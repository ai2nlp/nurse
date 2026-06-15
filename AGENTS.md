# CLAUDE.md — NurseShift

## Rules
- Always setup and update proper .gitignore and .env to the project
- Never do a git commit, or push to github, without the user's explicit permission
- make sure to use git fully & frequently

## Git Workflow
- Use clear and descriptive commit messages
- make your commits small and focused
- Never force push (unless the user asks you to)

## Project Overview
* **Project name:** NurseShift
* **What it does:** Sunday shift rotation manager for a 15-member nursing team with Group A/B, calendar view, and cloud sync
* **Tech stack:** Plain HTML / CSS / JavaScript, Supabase (auth + PostgreSQL), Cloudflare Pages
* **Main language:** JavaScript

## Project Structure
* `index.html` — single-page app shell
* `css/` — stylesheet
* `js/` — all application logic
  * `config.js` — Supabase credentials (git-ignored, never commit real values)
  * `state.js` — localStorage state management
  * `auth.js` — Supabase auth + cloud save/load
  * `app.js` — navigation and bootstrap (init() called by auth.js after login)
  * `dashboard.js`, `calendar.js`, `team.js`, `rotation.js`, `export.js`
* `docs/` — SQL migration files (numbered, in order)

## Environment
* Credentials live in `js/config.js` (git-ignored) and `.env` (git-ignored)
* Copy `.env.example` as reference
* Supabase project: https://qobsznttpnrlzqjodyym.supabase.co

## Key Commands
* **Run locally:** open `index.html` in browser or use VS Code Live Server (no build step)
* **Deploy:** push to `master` — Cloudflare Pages auto-deploys

## Code Style
* Use clear, descriptive variable and function names
* Keep files small and focused — one module per file
* Use existing patterns found in the codebase before inventing new ones
* Add brief comments only where logic is non-obvious

## Rules — Always Do
1. Always read existing code before modifying it
2. Always match the style and patterns already used in the codebase
3. Always handle errors gracefully — never let the app crash silently
4. Always keep the UI responsive and mobile-friendly

## Rules — Never Do
1. Never delete or overwrite files without confirming first
2. Never install new packages without asking
3. Never hardcode sensitive info (API keys, passwords, secrets)
4. Never make changes outside the scope of what was asked
5. Never push to git or deploy without explicit permission
6. Never rewrite working code just to "clean it up" unless asked

## Common Gotchas
* No build step — the browser runs the JS files directly; load order in index.html matters
* `init()` is NOT called on DOMContentLoaded — it is called by `auth.js` after the user authenticates
* `js/config.js` is git-ignored; the live site reads it from the committed file (anon key is public by design)
* State is stored in localStorage via `state.js`; Supabase is used only for cloud save/load

## When You're Stuck
* Ask me clarifying questions before guessing
* If a task is large, break it into steps and confirm the plan before coding
* If you hit an error you can't fix in 2 attempts, stop and explain the issue

# RULES SQL and Supabase
- always create .sql files for any SQL queries you want the user to run
- put all of the .sql files into /docs folder in that given project
- each file should start with a number to document the order of the operation
- we must have the entire DB schema documented in the /docs folder, in different .sql files
- name the files like "001_create_x_table.sql" or "002_change_rls_policy.sql" or "003_add_foreign_key.sql" etc.
