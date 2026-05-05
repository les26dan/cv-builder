- Read & understand Heimdall at `/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Heimdall`. This is our system's gatekeeper: monitor all flows, features, and dependencies without implementing features directly. System-level architecture is maintained via Heimdall.
- Review our existing codebase at `/Users/tomnguyen/Documents/Cursor/Projects/CV Builder`, carefully analyze the existing components, features, and user flows implemented in their respective codebases, to gain full understanding of the system logic, architecture, and UX patterns of these core pages:
   - Landing Page
   - Account Creation & Login
   - CV Workspace
   - CV Upload
   - CV Guided Editing
   - CV Workflow Integration
- The focus of our initiative is to improve the CV parser & database.
- Always assume that all changes are made on both local and production environment. Since you don't have access to .env.local, ask me whenever you have to gain access to production credentials.
- Let me know once you have fully understood the context here. Do not proceed to make any change yet.

**CV Parser**
+ Implement the CV attachment sent to ChatGPT API
+ Implement the prompts sent to ChatGPT API, depending the system's language being used
+ Implement the system's logic to handle the returned JSON. 
1) In case the possibility score is >= 5, the system must navigate the user to the Guided Editing page, parse the structured returned data accurately to the CV Editing panel's section, then display a popup/ message informing the users about the successful parsing.
2) In case the possibility score is < 5, the system must stay on CV Upload page, display a popup/ message informing the users:
English:
“The document uploaded doesn’t seem to be a CV or resume. Please upload a valid CV document.”

Vietnamese:
“Tài liệu vừa tải lên không giống CV hoặc hồ sơ ứng tuyển. Vui lòng tải lên đúng file CV hợp lệ.”

Network Error Handling:
	•	If the response is invalid or incomplete due to network errors, the system should clearly show the message:
	•	English: “An error occurred. Please upload your CV again.”
	•	Vietnamese: “Đã xảy ra lỗi. Vui lòng tải lại CV của bạn.”

- Important note:
+ System language (user preferral - the langugage users are comfortable updating their CV with) vs user’s content language (Users Uploaded CV, CV Guided Editing content) must be handled separately. For example, a Vietnamese user might be preparing their CV in English for a foreign company must still prefer to do so (preparing CV) in Vietnamese.
- With that, prepare a comprehensive, accurate to-dos and proceed with implementation


*Careful Documentation*
- Then, ensure what we have implemented passes Heimdall Compliance:
    - New changes in flows, modules & components are documented in `/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Heimdall/system-architecture.md`
    - New changes in components, features & their use are registered in `/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Heimdall/features.yaml`
    - If your implementation touched sensitive flows (PII, auth, input validation ...), update `/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Heimdall/security-audit.md`
    - Any technical debt, skipped test, ad-hoc workaround or quick fix noted in `/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Heimdall/tech-debt.md`. This serves as a dictionary/ audit log for all of our accumulated known code smell, TODOs, skipped tests.

*Progress Update*
- Then, update the `'/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Projects/CV Workflow/Projects Working Directory/chatgpt-ai-integration/tasks.md'` [//] marking what we have implemented being completed. Then, if the entire task is completed, move it down to the Completed Tasks section. [//]
- Then, update the `'/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Projects/CV Workflow/Projects Working Directory/chatgpt-ai-integration/progress.md'` [//] to reflect the current state of the project, including all of the lessons, experiences, tips & tricks you've learned during implementing this task, troubleshooting bugs ...
- Stop and we will open a new chat for the next task.

----------
**Project working files creation**
- Read the master Product Brief at `/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Materials/Documents/Product Brief.md`.
- Read the Product Spec of the project at `'/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Projects/CV Workflow/cv-suggestions-ai/JD–CV Optimization & “Apply All” Enhanced Workflow (Desktop) – Product Specification.md'`. [//]
- Read & understand Heimdall at `/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Heimdall`. This is our system's gatekeeper: monitor all flows, features, and dependencies without implementing features directly. System-level architecture is maintained via Heimdall.
- This project aims to 
- Review these previous projects and carefully analyze the existing components, features, and user flows implemented in their respective codebases, as well as the associated Product Specifications, to gain full understanding of the system logic, architecture, and UX patterns:
   - Landing Page at `/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Projects/landing-page`.
   - Account Creation & Login at `'/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Projects/Fundamental Services/Account Creation & Login'`
   - CV Workspace page at `'/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Projects/CV Workflow/cv-workspace-navigation'`
   - CV & JD Upload page at `'/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Projects/CV Workflow/cv-jd-upload'`
   - CV Guided Editing page at `'/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Projects/CV Workflow/cv-guided-editing'`
   - CV Workflow Integration at `'/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Projects/CV Workflow/cv-workflow-integration'`
- Pay special attention to the technical stack development workflows file structure and project organization patterns used across all previous projects to ensure consistency and correctness in implementation.
- Always check carefully to confirm that you are working inside the correct project directory before executing any implementation or modification tasks.
- Let the user know once you have finished.

- With all context fully loaded and verified, prepare the following working files for this project in: `/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/Projects/CV Workflow/cv-workflow-integration/` [//]

### 1. Project Plan
- Create a context-rich `project-plan.md` that clearly defines:
  - The objective and scope of this specific project
  - P0 features and flows to be delivered
  - UX principles, user goals, and interaction patterns
  - What is in scope vs. out of scope
  - Success criteria and completion benchmarks
- Ensure the plan closely aligns with the Product Spec and system structure used in previous CV Builder projects.

### 2. Tasks
- Create a `tasks.md` file with two sections:
  - **REMAINING TASKS**
  - **COMPLETED TASKS**
- Task Design Rules:
   - Each task must be a **self-contained unit of work** that fully encapsulates:
   - Frontend implementation
   - Backend logic (if applicable)
   - State handling and user interaction behavior
   - Tasks should be **testable and locally deployable on their own**, without needing other tasks to complete.
      - If there are dependencies, they must be carefully & accurately specified.
   - You must not include any estimated time for any task.
   - Avoid scattering frontend/backend responsibilities across multiple task blocks.
   - Organize the entire scope into **no more than 5 top-level tasks**, each with unlimited subtasks as needed for clarity.
   - Each task should reference to one or more Product Spec requirements.
   - Each task must have an empty checkbox [ ] before the task name so that later when it's finished, you can mark it as done.
      - For example: [ ] **Task 1: Prerequisite Validation & JD Input Enhancement**
      - At creation, all subtasks status must be unchecked i.e [ ]

*Implementation Alignment*
- Both `project-plan.md` and `tasks.md` must:
  - Follow the patterns, formatting, and naming conventions used in previous projects
  - Be logically structured, exhaustive, and easy to reason through — supporting future task review, bug fixing, or spec changes
  - Be consistent with the stack, folder structure, and architectural conventions observed in:
    - Landing Page
    - Account Creation & Login
    - CV Workspace
    - CV Upload
    - Guided Editing
    - Workflow Integration


----------
# Technical Documents for human (not for Cursor)
**Project Plan (`project-plan.md`)**
   - A high-level description of the project and what it aims to accomplish
   - Any significant types, entities, or whatever you call them in your language
   - Business rules
   - Success metrics
   - Other details that are relevant to the technical implementation of the project

**Tasks List (`tasks.md`)**
   - Comprehensive task list derived directly from the technical plan
   - Use checkbox format: `- [ ]` for tasks
   - Organize into logical sections (analysis, setup, implementation, testing, etc.)
   - Ensure tasks are specific and actionable

**Heimdall**
- Act as the system architect for CV Builder.
- Maintain a live understanding of the full system structure — APIs, features, configs, flows, component boundaries, test coverage, and accummulated tech debt.
- Track and update `/Users/tomnguyen/Documents/Cursor/Projects/CV Builder/system/` with:
  - `system-architecture.md` → data flows, components, high-level interfaces
  - `features.yaml` → features-to-components registry
  - `security-audit.md` → security policies, sensitive flows, auth checks
  - `tech-debt.md` → TODOs, known vulnerabilities, test gaps
  - `cursor-guide.md` → how to use Cursor correctly in this system
- Ensure all new files, features, and folders are registered under `/system/` via comments or metadata blocks.
- Update relevant files new architectural changes.
- Whenever a component or config is created, reflect that in the system map.