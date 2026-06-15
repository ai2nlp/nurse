# NurseShift

Sunday shift rotation manager for nursing teams. Tracks Group A / Group B assignments, supports concurrent and alternating rotation modes, and provides calendar, dashboard, and export views.

**Live site:** https://nurseshift.ai2nlp.com

---

## Features

- Dashboard with this Sunday's assignments, upcoming timeline, and rest tracker
- Monthly calendar with shift badges per day
- Team manager — add, edit, reorder (drag & drop), switch groups, delete members
- Concurrent or alternating rotation modes
- Manual shift overrides per date
- Cloud save / load via Supabase (per authenticated user)
- CSV export, PDF print, and email schedule directly to the signed-in user
- Email authentication (Supabase)
- Fully responsive, dark glassmorphism UI

---

## Tech Stack

- Plain HTML / CSS / JavaScript (no build step)
- [Supabase](https://supabase.com) — auth + PostgreSQL database
- [EmailJS](https://emailjs.com) — client-side email delivery (Outlook/SMTP)
- Deployed on [Cloudflare Pages](https://pages.cloudflare.com)

---

## Local Setup

1. Clone the repo
   ```
   git clone https://github.com/ai2nlp/nurse.git
   cd nurse
   ```

2. Create `js/config.js` with your credentials:
   ```js
   const SUPABASE_URL      = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key';

   const EMAILJS_PUBLIC_KEY  = 'your-emailjs-public-key';
   const EMAILJS_SERVICE_ID  = 'service_xxxxxxx';
   const EMAILJS_TEMPLATE_ID = 'template_xxxxxxx';
   ```

3. Open `index.html` in a browser (no server needed — or use VS Code Live Server)

---

## Database Setup

Run the SQL files in `/docs` in order against your Supabase project (SQL Editor):

| File | Description |
|------|-------------|
| `001_create_team_state_table.sql` | Creates the `team_state` table |
| `002_enable_rls_team_state.sql` | Enables Row Level Security |
| `003_create_team_state_policies.sql` | Adds per-user RLS policies |

---

## EmailJS Setup

1. Create a free account at [emailjs.com](https://emailjs.com)
2. Add an email service (Outlook recommended)
3. Create a template with:
   - **To:** `{{to_email}}`
   - **Subject:** `NurseShift — Sunday Rotation Schedule`
   - **Body (HTML):** `{{{schedule_html}}}` — triple braces to render HTML
4. Copy your Service ID, Template ID, and Public Key into `js/config.js`

---

## Project Structure

```
nurse/
├── index.html          # Single-page app shell
├── css/
│   └── styles.css      # Dark glassmorphism stylesheet
├── js/
│   ├── config.js       # All credentials (git-ignored)
│   ├── state.js        # localStorage state management
│   ├── auth.js         # Supabase auth, cloud save/load, EmailJS init
│   ├── app.js          # Navigation and app bootstrap
│   ├── dashboard.js    # Dashboard view renderer
│   ├── calendar.js     # Calendar view renderer
│   ├── team.js         # Team management
│   ├── rotation.js     # Rotation logic
│   └── export.js       # CSV / PDF / email export
├── docs/               # SQL migration files
└── .env.example        # Credential template
```

---

## Deployment

The site auto-deploys to Cloudflare Pages on every push to `master`.  
No build step required — Cloudflare serves the static files directly.
