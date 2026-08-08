# Cosmic CTF Dashboard

Act as an expert frontend engineer and UI/UX designer. Build a complete, interactive React web application for a Capture The Flag (CTF) game called "Wargames".

**Visual Theme & UX (Deep Space):**

Create a highly immersive, animated deep space UI. 

- Background: Implement an animated starry background (e.g., twinkling stars or a slow-moving starfield) and include subtle floating planets or nebulas in the corners.

- Colors: Use deep void black and dark cosmic blues for the background. 

- UI Elements: Make panels and cards look like sleek spaceship dashboards with frosted glass effects (glassmorphism). 

- Accents: Use bright neon glowing colors (cyan, magenta, or alien green) for buttons, active states, and borders.

- Animations: Add smooth hover effects (buttons should glow brighter when hovered) and gentle floating animations for dashboard elements.

**Pages and Layout:**

1. Global Navbar: A fixed header showing the Wargames logo, the user's current points, and links to "Missions" (Levels) and "Leaderboard".

2. Login View: A sleek spaceship-style login terminal asking for a username and password.

3. Dashboard (Levels): A grid of challenge cards. Locked challenges should look dark and offline; unlocked ones should glow.

4. Challenge View: A detailed page for a specific challenge. It must have a glowing input field for the "Flag" and a "Submit Flag" button.

5. Leaderboard View: A high-tech ranking table showing top players.

**API Integration Logic (Endpoints):**

Prepare the frontend code to easily hook up to these endpoints. Create standard fetch/axios templates for:

- `POST /api/login` (Triggered on the Login terminal)

- `GET /api/progress` (Fetches points and unlocked levels for the Navbar and Dashboard)

- `POST /api/verify` (Sends the flag input on the Challenge View and returns success/fail)

- `GET /api/leaderboard` (Fetches player rankings for the Leaderboard View)

Please generate the complete, styled UI, ensuring all animations and space-themed elements are responsive and look great on both desktop and mobile.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/59e3d9c5-50c3-43a4-9916-92380b96b929).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
