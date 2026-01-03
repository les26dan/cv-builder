# OkBuddy Landing Page – Technical Plan

## 1. 🧱 Tech Stack Overview

| Layer      | Technology         |
|------------|--------------------|
| Framework  | Next.js (TypeScript) |
| Styling    | TailwindCSS         |
| CI/CD      | Netlify + GitHub    |
| i18n       | Config-based (VN default) |
| Forms      | Netlify Forms or Supabase via `api/submit.ts` |
| Analytics  | Optional MVP console logging |

---

## 2. 📐 Page Structure (Fixed Order)

The landing page structure must follow this exact order and must not vary across sessions or languages:

1. `HeroSection`
2. `ProblemATS`
3. `ProblemKeywords`
4. `ProblemMassCV`
5. `ProblemCoverLetters`
6. `WaitlistSection`
7. `Footer`

---

## 3. 🌐 Language & Strings

- Vietnamese is the **default language** and only language for this MVP
- All UI strings must be pulled from `/config/texts/vi/landingPage.ts`
- Centralized `texts` folder structure:

/config/texts/
├── vi/
│   └── landingPage.ts
├── en/        # (optional future use)
│   └── landingPage.ts
└── index.ts   # aggregates

Use structured keys:
```ts
landingPage.hero.title
landingPage.problems.ats.description
landingPage.waitlist.cta


⸻

4. 📁 Folder Structure

/pages/
  index.tsx                   ← Loads all sections in order

/components/
  HeroSection.tsx
  ProblemATS.tsx
  ProblemKeywords.tsx
  ProblemMassCV.tsx
  ProblemCoverLetters.tsx
  WaitlistSection.tsx
  Footer.tsx

/config/
  texts/
    vi/
      landingPage.ts
  index.ts

/styles/
  globals.css

/utils/
  logEvent.ts (optional)


⸻

5. 📱 Responsiveness & Accessibility
	•	All components must:
	•	Support mobile (≤768px), tablet (768px–1024px), and desktop (>1024px)
	•	Use Tailwind responsive classes (sm:, md:, lg:)
	•	Have readable, scalable typography and touch-friendly CTA sizes
	•	Follow accessible HTML practices (contrast, alt text, aria where needed)

⸻

6. 🔐 Security & Form Handling
	•	Email capture must be:
	•	Validated with regex or React Hook Form
	•	Sanitized
	•	Stored via either:
	•	Netlify Form handler
	•	Or pages/api/submit.ts to Supabase
	•	No external scripts allowed unless essential (no trackers)

⸻

7. 🧪 Testing Strategy

Type	Tool
Unit Tests	Vitest / Jest
UI Tests	React Testing Library
Mobile Rendering	Manual or Playwright
Form Submission	Manual or Jest mocks

All sections must render without errors and pass visual consistency checks.

⸻

8. 🚀 Deployment
	•	Deployed to Netlify
	•	main branch triggers production
	•	Branch previews enabled via Netlify CI
	•	.env secrets stored in Netlify dashboard
