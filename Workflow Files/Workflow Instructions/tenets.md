**Development Tenets**
> Foundational engineering principles to guide all of our development.

1. Minimalism & Extreme Cost Efficiency
- Default to **minimal and low-cost** implementations using open-source libraries and free-tier infrastructure (e.g., Vercel, Supabase, SQLite). Default to cheapest options (open-source tools, free-tier infra, no over-architecting).
- Avoid over-engineering; **only build what delivers validated user value**.
- Every decision must be **cost-justified** — infra, AI API calls, tools, and dependencies. All code must be cloud-friendly and deployable on low-cost infrastructur
- Prefer “good enough now” over “perfect later” — build only what’s proven valuable.
- MVP does **not mean crude**, but it means **efficient, scoped for learning**.
- No persistence without purpose. No complexity without conversion.

2. Rapid Experimentation & Configurability
- Develop all features and pages with inherent support for rapid experimentation.
- Set up clear, automated measurement mechanisms early to facilitate effortless testing and decision-making.
- **No hardcoded UI copy** — all CTAs, pricing, feature toggles must be loaded from config files (`/config/experiments.ts`, `abTests.json`).
- Every UI component and flow (landing page, onboarding flow, form ...) must be **multi-variant-testable** (A/B/C) with no code changes required.
- Design landing pages, CTAs, and onboarding flows to change copy, structure, or visuals dynamically without code edits.
- Logs, metrics, and test outcomes must be **automatically tracked and visualized** as part of experiment infrastructure.
- Prioritize tools and setups that support:
	•	Easy segmentation by experiment group (A/B/C)
	•	Funnel/drop-off analysis
	•	Event and cohort analysis
- Design analytics to answer real product questions fast, like:
	•	“Which variant has the highest sign-up rate?”
	•	“What usage patterns correlate with retention?”

3. Maximize Learning Through Data Collection
- Collect data at every meaningful user interaction: page views, button clicks, form inputs, feature usage, drop-offs.
- From the beginning, practice labeling, cleaning, and organizing all data — good data hygiene starts Day 1.
- Store all collected data in clearly structured, human-readable formats (well-named collections, fields, tables).

4. Modular, Replaceable, Adaptable
- **Everything must be swappable.** No hardcoded dependencies, vendors, or tools.
- Every component (UI, backend logic, integrations ...) should be replaceable independently without breaking the system.
- Avoid tech debt that assumes permanence.
- Components, services, and utilities must be loosely coupled and easily replaceable.
- Every module (auth, billing, notifications, cover letter generation ...) must be built behind **interfaces or adapters**.
- No hardcoded vendors, services, or logic.
- Code must follow **OOP or composable functional patterns** that allow:
  - Dependency injection or mocking
  - Fast replacement
  - Versioning and fallbacks

> Build it so it can be thrown away or swapped out — without breaking anything else.

5. Relentless, Rigorous Testing & Code Health
- Implement thorough unit tests for every piece of code. Write tests alongside features, not afterward — every module must include unit tests before merge.
- Must automatically scaffold a corresponding test file (Component.test.tsx, logic.test.ts) when generating any new component or service.
- CI/CD must include regression tests — every push should prevent historical bugs from resurfacing.
- Never rely solely on manual testing — coverage > 80% is non-negotiable.
- Maintain and continuously expand a robust regression testing suite.
- Tests should cover:
  - Business logic
  - UI states
  - Edge cases and error boundaries
- **Zero tolerance for warnings**: Fix all linting errors and warnings before deployment
- Regression bugs must never recur: every bug fix must include a test reproducing the bug before it is fixed.
- Maintain a /tests/regression/ suite to track recurring patterns and high-risk flows.
- Never push code without a matching test — even if it’s just a stub.
- **Component-first testing**: Write tests for each component as it's developed, not as an afterthought
- **Test coverage verification**: Use `npm test -- --coverage` to ensure 100% coverage, including statements, branches, functions, and lines before deployment
- **Write tests for every component** - Ensure 100% component coverage with meaningful test cases
- **Test user interactions** - Include form validation, button clicks, and state changes
- **Use specific selectors** - Avoid generic text matching that could cause multiple element conflicts
- **Test responsive behavior** - Verify components work across different screen sizes
- **Always verify production build before deployment**: Run `npm run build` to catch any build-time errors
- **Implement proper error handling** - Add validation and user feedback for all interactive elements
- **Use TypeScript interfaces** - Define proper types for props and state to prevent runtime errors
- **TypeScript strict compliance**: Ensure proper type safety throughout the codebase
- **ESLint compliance** - Fix all linting errors before deployment
- **Production build success** - Ensure clean builds with no warnings

6. Documentation is a crucial part of the code
- Code must be self-descriptive: well-named functions, variables, and modules are the first line of documentation. 
- **Follow consistent naming conventions**: Use descriptive names for components, functions, and variables
- Maintains consistent inline documentation or comments to accelerate future developments and debugging processes.
  - Comments should explain why something is done a certain way, not just what it does.
  - All exported components and services must have JSDoc-style headers describing:
    •	Purpose
    •	Inputs & outputs
    •	Usage context
- All systems should include a short **README.md or usage guide** (why, what, how).
- All configuration should be placed in `/config`, `/constants`, or `/schemas`.

- Whenever a component or config is created, reflect that in the system map.
- No feature is complete without a clear usage doc, code sample, or explanation that allows a future team member or AI to modify it with confidence. Any AI assistant or human software engineer should be able to:
  - Understand your codebase via layout and comments
  - Trace business logic with minimal guesswork
  - Edit code with confidence based on file structure

- **Progress tracking**: Maintain detailed progress.md with specific achievements and metrics
- **Risk assessment**: Include risk levels and mitigation strategies in documentation
- **Priority matrices**: Use impact/risk/cost analysis for technical debt prioritization

7. Security is sacred from the beginning
  - Build with security best practices from the start; avoid incurring future security-related technical debt. Security is **never deferred to later**.
  - Protect user data rigorously—use minimal data collection and strong anonymization/pseudonymization practices by default.
  - Use **privacy-by-design**: minimal data collection, anonymization where possible, no 3rd-party loading without user benefit.
  - All auth, payments, and data flows must be **auditable and explainable**.
  - **Performance optimization** - Use Next.js best practices for optimal loading times
  - **Security considerations** - Implement proper input validation and sanitization
  - Dependencies must be checked for **vulnerabilities regularly** (e.g., `npm audit` or `yarn audit`).
  - Document all access points and roles — who can do what, and how it's protected.
  ### Common threats to anticipate:
    | Threat | Prevention Strategy |
  | **XSS (Cross-Site Scripting)** | Sanitize inputs, escape outputs |
  | **CSRF (Cross-Site Request Forgery)** | CSRF tokens, SameSite cookie policy |
  | **Insecure APIs** | Use API keys, validate all payloads server-side |
  | **Credential leakage** | Use `.env` files + secrets manager (e.g., Vercel environment variables) |
  | **Lack of encryption** | Enforce HTTPS, encrypt sensitive data in transit and at rest |
  | **3rd-party service over-permissions** | Use scoped access keys and rotate regularly.

8. Every UI implemented must strictly follow the .CSS and Product Spec files provided by the user 

### Strict Design Adherence Protocol
**MANDATORY**:
- When design files (CSS specifications, design documents) and product files (Product Spec, Product Requirements) are provided, they MUST be followed literally without interpretation or assumption.
- If the .CSS design file is not provided in a frontend implementation task, ask the user for the design file. Do not 

#### Design File Implementation Rules
- **READ DESIGN FILES COMPLETELY**: Always read the entire design file before starting implementation
- **LITERAL CSS TRANSLATION**: Copy CSS properties exactly as specified in design files
- **NO INTERPRETATION**: Do not make assumptions about what the design "should" look like
- **NO FRAMEWORK SUBSTITUTION**: Do not substitute TailwindCSS classes for exact CSS specifications
- **VERIFY EVERY PROPERTY**: Each CSS property from the design file must be implemented exactly

#### Mandatory Design Implementation Checklist
- [ ] **Complete Design File Review**: Read entire design file from start to finish
- [ ] **Property-by-Property Implementation**: Implement each CSS property exactly as specified
- [ ] **Dimension Verification**: All widths, heights, padding, margins match design specifications exactly
- [ ] **Color Code Accuracy**: Use exact color codes from design file (e.g., #0288D1, #E0F7FA)
- [ ] **Typography Matching**: Font family, size, weight, line-height exactly as specified
- [ ] **Layout Structure Compliance**: Flexbox properties, positioning, order exactly as designed
- [ ] **Visual Verification**: Component visually matches design file specifications

#### When Design Files Are Provided
1. **STOP**: Do not proceed with implementation assumptions
2. **READ**: Read the complete design file thoroughly
3. **EXTRACT**: Extract every CSS property and value from the design
4. **IMPLEMENT**: Use inline styles with exact property values when specified
5. **VERIFY**: Test that rendered component matches design specifications exactly
6. **NO SHORTCUTS**: Do not use CSS frameworks or shortcuts that deviate from specifications

#### Design Implementation Anti-Patterns (FORBIDDEN)
- ❌ Using TailwindCSS classes instead of exact CSS values
- ❌ Making assumptions about "what the designer meant"
- ❌ Approximating values (e.g., using 20px instead of specified 24px)
- ❌ Substituting similar colors instead of exact color codes
- ❌ Skipping properties deemed "unimportant"
- ❌ Using responsive utilities when exact dimensions are specified
- ❌ Implementing based on visual similarity rather than code specifications

#### Design File Location Patterns
- Look for design files in `/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Materials/Designs` directories
- Common file extensions: `.txt`, `.css`, `.md`, `.json`
- Always check for project-specific design folders
- When in doubt, ask for design file location before implementing anything related to frontend/ UI

#### Error Prevention Protocol
1. **Before coding**: Confirm design file exists and has been read completely
2. **During coding**: Reference design file for every CSS property
3. **After coding**: Compare rendered output with design specifications
4. **If stuck**: Ask for clarification rather than making assumptions
5. **When conflicted**: Prioritize design file specifications over personal preferences

#### Documentation Requirements
- Document any deviations from design file with explicit justification
- Note any missing specifications that required implementation decisions
- Update Heimdall with design compliance status
- Include design file references in component documentation

9. Strings, Copy, and Multilingual Content Must Be Centralized into a Single Source of Truth
	•	All UI strings — including headlines, CTAs, tooltips, form labels, error messages, and marketing copy — must be stored in centralized, structured config files. Never hardcode strings inside components.
	•	The single source of truth for copy must live in the /config/texts/ folder, organized by feature or component.