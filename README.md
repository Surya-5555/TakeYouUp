# Interactive Wall Calendar Component

A highly responsive, physics-driven, premium interactive calendar built for the Take You Forward Frontend Engineering Challenge. 

This project goes beyond a standard grid UI by combining strict functional requirements (day range selection, integrated notes) with an immersive, physical "wall calendar" aesthetic, complete with 3D interactions and a dynamic environmental theme.

### Quick Links
* **Live Demo:** https://takeyouup.vercel.app/
* **Video Walkthrough:** https://www.loom.com/share/4348081030084703938a78930521978e

* **TechStack Diagram:** <img width="1410" height="795" alt="techStack" src="https://github.com/user-attachments/assets/c63cde45-055a-4c02-a41c-91a14f94f543" />

* **Architecture Diagram:** <img width="1382" height="742" alt="architecture diagram" src="https://github.com/user-attachments/assets/9d4379fa-68a4-44c1-bf07-54be4936a81e" />

---

## Key Features & Creative Liberties

* **The "Pragmatic Hybrid" Architecture:** A dual styling approach using **Tailwind CSS** for fluid, mobile-first layouts, and isolated **CSS Modules** for complex 3D math and perspective transformations.
* **Ambient Physics & 3D Interactions:** The calendar isn't static. It features a gentle "wind sway" animation, immersive dust particles, and a fully interactive 3D page-flipping mechanism to mimic a real physical object.
* **Dual UX Modes (Zero Click-Conflict):** Implemented a dedicated UI toggle to separate "Plan Range" mode (for multi-day intervals) and "Daily Notes" mode (for single-day memos). This eliminates the classic double-click frustration found in standard date pickers.
* **Smart Range Workflow:** Selecting an end date auto-pops the notes modal. Saving the note creates a persistent visual "ribbon" across the grid and bulk-clones the note to every day in the interval, complete with a handwritten preview.
* **Immersive Day/Night Theme:** Instead of a standard dark mode button, the theme is controlled by a physical lightbulb switch in the background. It transitions the entire environment seamlessly between a sunlit Morning and a moody Night without any color contrast failures.
* **Defensive Chronological Safety:** Built-in "Smart Swap" logic automatically corrects user input if they select an end date chronologically before the start date.

---

## Tech Stack & Architecture

This project is strictly frontend, utilizing client-side storage for persistence as requested.

* **Core:** Next.js & React 
* **State Management:** Zustand (Handling both transient UI state and `localStorage` persistence via middleware).
* **Styling:** Tailwind CSS (Grid/Responsive) + CSS Modules (3D Physics/Animations).
* **Date Logic:** `date-fns` (Bulletproof, timezone-safe calculations like `eachDayOfInterval`).
* **Icons/Assets:** `lucide-react` (For crisp, scalable UI icons).

---

## Project Structure

```text
TakeYouUp/
├── frontend/
│   ├── public/             # Assets (Robot 3D model, Portrait images, Icons)
│   ├── src/
│   │   ├── app/            # Next.js App Router (Pages, Layouts, Global Styles)
│   │   ├── components/
│   │   │   └── calendar/   # Main components (InteractiveCalendar, Intro, Styles)
│   │   ├── store/          # Zustand State Management (Calendar Logic, Persistence)
│   │   └── lib/            # Utility functions and shared helpers
│   ├── package.json        # Project dependencies and scripts
│   └── tsconfig.json       # TypeScript configuration
└── README.md               # Documentation
```

---

## Responsive Design Strategy

The component was built strictly **Mobile-First**:
1. **Mobile:** The layout gracefully collapses into a vertically stacked view. The interactive grid remains easily tappable on touch screens without requiring a horizontal scroll.
2. **Desktop:** Expands into a side-by-side view, honoring the spatial arrangement of the physical wall calendar inspiration, keeping the Monthly Planner and Daily Grid in perfect visual balance.

---

## Getting Started (Local Development)

To run this project locally on your machine, follow these steps:

**1. Clone the repository**
```bash
git clone https://github.com/Surya-5555/TakeYouUp.git
cd TakeYouUp
```

**2. Install dependencies**
```bash
npm install
```

**3. Run the development server**
```bash
npm run dev
```
