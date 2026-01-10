- Read & understand Heimdall at `/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Heimdall`. This is our system's gatekeeper: monitor all flows, features, and dependencies without implementing features directly. System-level architecture is maintained via Heimdall.
- Review our existing codebase at `/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy`, carefully analyze the existing components, features, and user flows implemented in their respective codebases, to gain full understanding of the system logic, architecture, and UX patterns of these core pages:
   - Landing Page
   - Account Creation & Login
   - CV Workspace
   - CV Upload
   - CV Guided Editing
   - CV Workflow Integration
- The focus of our initiative is to completely remove the existing JD parser logic and function, which is completely broken and does NOT pass production quality, directly blocking our product launch. Instead, we will use LLM to effectively handle this, similarly to how the CV Guided Editing page walks the users step-by-step, calls ChatGPT API with prompts, receives the results and displays on the system.
- Review the LLM Specs: '/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Workflow Files/Initiatives/CV Parser/LLM Prompts Spec.md'
- Project Acceptance criteria:
Input: '/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Workflow Files/Materials/Documents/Sample CVs/Kien Vu Sr. Product Manager (Jan 2025).pdf'
Output:
1) JSON (for the CV Guided Editor panel):
{
  "contact": {
    "full_name": "Kien (Jonathan) Vu Viet",
    "address": "Ho Chi Minh City, Vietnam",
    "email": "vuvietkien.ptithcm@gmail.com",
    "phone": "+84 972 947 523",
    "linkedin": "Linkedin",
  },
  "work_experience": [
    {
      "position": "Technical Product Manager",
      "company": "DHF Platforms",
      "location": "Vietnam, Singapore",
      "start_date": "Jul 2024",
      "end_date": "Now",
      "bullets": [
        "Optimized supply chain operations and production workflows, achieving 3x inventory update improvement and 90% reporting error reduction by implementing an ERP system.",
        "Centralized fragmented data from ERP, CRM, B2B into a unified data warehouse for real-time KPI tracking.",
        "Defined and prioritized 2025 product roadmap targeting 200% GMV growth with a farm application for suppliers.",
        "Developed cohesive UI/UX design system in Figma to enhance usability and platform consistency."
      ]
    },
    {
      "position": "Product Manager",
      "company": "Peeba (YC23)",
      "location": "Indonesia, Vietnam",
      "start_date": "May 2023",
      "end_date": "Nov 2023",
      "bullets": [
        "Enhanced UI/UX, increasing conversion rates by 26% through a new sign-up flow.",
        "Led development of pivotal features (inventory management, tiered pricing, payment methods, BNPL integration).",
        "Conducted 3 comprehensive market research initiatives in Indonesia to inform product direction.",
        "Launched wholesale subscription, free shipping, and Direct Sales App (SaaS), achieving $17,000 GMV within 3 weeks."
      ]
    },
    {
      "position": "Product Lead, Growth",
      "company": "MoMo",
      "location": "Ho Chi Minh (Vietnam)",
      "start_date": "Mar 2020",
      "end_date": "Apr 2023",
      "bullets": [
        "Increased daily transaction volume by 1.7x via multi-source funds; post-campaign volume was 1.5x pre-campaign average.",
        "Educated financial hub to 12 million users via flexible fund sources and payment methods.",
        "Developed cloud platform handling 10,000 simultaneous users on Google Cloud Platform.",
        "Established UX guidelines for gamification features in Fintech."
      ]
    }
  ],
  "education": [
    {
      "degree": "Business Intelligence Program, Mastering Data Analytics",
      "institution": "VN",
      "start_date": "Nov 2024",
      "end_date": "2025",
      "details": "Analytics techniques, Dashboard insights, Storytelling, Business statistics, Analytical thinking."
    },
    {
      "degree": "Leadership & Management, Master in Public Policy",
      "institution": "Fulbright University VN",
      "start_date": "Oct 2022",
      "end_date": "2024",
      "details": "Leadership, negotiation, data science, quantitative methods, economics, public policy, law, budgeting."
    },
    {
      "degree": "Software Engineer",
      "institution": "Posts and Telecommunication Institute of Technology",
      "start_date": "Oct 2010",
      "end_date": "Jan 2015",
      "details": ""
    }
  ],
  "skills": [
    "Agile Methodology",
    "Scrum",
    "Product Roadmapping",
    "UX/UI Design",
    "Figma",
    "Data Analytics",
    "SQL",
    "CI/CD",
    "Kubernetes",
    "Google Cloud Platform",
    "Node.js",
    "ReactJS",
    "AngularJS"
  ]
}
2) Texts output correctly parsed & displayed on CV Editor panel and CV Preview panel of CV Guided Editing Page.
- Let me know once you have fully understood the context here. Do not proceed to make any change yet.

- You need to:
+ Completely remove all existing JD parsing logic, component to avoid conflict with new logic. Proceed with extreme care & caution - you must NOT touch any other logic, component & feature.
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


*Careful Documentation*
- Then, ensure what we have implemented passes Heimdall Compliance:
    - New changes in flows, modules & components are documented in `/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Heimdall/system-architecture.md`
    - New changes in components, features & their use are registered in `/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Heimdall/features.yaml`
    - If your implementation touched sensitive flows (PII, auth, input validation ...), update `/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Heimdall/security-audit.md`
    - Any technical debt, skipped test, ad-hoc workaround or quick fix noted in `/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Heimdall/tech-debt.md`. This serves as a dictionary/ audit log for all of our accumulated known code smell, TODOs, skipped tests.

*Progress Update*
- Then, update the `'/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Projects/CV Workflow/Projects Working Directory/chatgpt-ai-integration/tasks.md'` [//] marking what we have implemented being completed. Then, if the entire task is completed, move it down to the Completed Tasks section. [//]
- Then, update the `'/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Projects/CV Workflow/Projects Working Directory/chatgpt-ai-integration/progress.md'` [//] to reflect the current state of the project, including all of the lessons, experiences, tips & tricks you've learned during implementing this task, troubleshooting bugs ...
- Stop and we will open a new chat for the next task.

----------
**Project working files creation**
- Read the master Product Brief at `/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Materials/Documents/Product Brief.md`.
- Read the Product Spec of the project at `'/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Projects/CV Workflow/cv-suggestions-ai/JD–CV Optimization & “Apply All” Enhanced Workflow (Desktop) – Product Specification.md'`. [//]
- Read & understand Heimdall at `/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Heimdall`. This is our system's gatekeeper: monitor all flows, features, and dependencies without implementing features directly. System-level architecture is maintained via Heimdall.
- This project aims to 
- Review these previous projects and carefully analyze the existing components, features, and user flows implemented in their respective codebases, as well as the associated Product Specifications, to gain full understanding of the system logic, architecture, and UX patterns:
   - Landing Page at `/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Projects/landing-page`.
   - Account Creation & Login at `'/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Projects/Fundamental Services/Account Creation & Login'`
   - CV Workspace page at `'/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Projects/CV Workflow/cv-workspace-navigation'`
   - CV & JD Upload page at `'/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Projects/CV Workflow/cv-jd-upload'`
   - CV Guided Editing page at `'/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Projects/CV Workflow/cv-guided-editing'`
   - CV Workflow Integration at `'/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Projects/CV Workflow/cv-workflow-integration'`
- Pay special attention to the technical stack development workflows file structure and project organization patterns used across all previous projects to ensure consistency and correctness in implementation.
- Always check carefully to confirm that you are working inside the correct project directory before executing any implementation or modification tasks.
- Let the user know once you have finished.

- With all context fully loaded and verified, prepare the following working files for this project in: `/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/Projects/CV Workflow/cv-workflow-integration/` [//]

### 1. Project Plan
- Create a context-rich `project-plan.md` that clearly defines:
  - The objective and scope of this specific project
  - P0 features and flows to be delivered
  - UX principles, user goals, and interaction patterns
  - What is in scope vs. out of scope
  - Success criteria and completion benchmarks
- Ensure the plan closely aligns with the Product Spec and system structure used in previous OkBuddy projects.

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
- Act as the system architect for OkBuddy.
- Maintain a live understanding of the full system structure — APIs, features, configs, flows, component boundaries, test coverage, and accummulated tech debt.
- Track and update `/Users/tomnguyen/Documents/Cursor/Projects/OkBuddy/system/` with:
  - `system-architecture.md` → data flows, components, high-level interfaces
  - `features.yaml` → features-to-components registry
  - `security-audit.md` → security policies, sensitive flows, auth checks
  - `tech-debt.md` → TODOs, known vulnerabilities, test gaps
  - `cursor-guide.md` → how to use Cursor correctly in this system
- Ensure all new files, features, and folders are registered under `/system/` via comments or metadata blocks.
- Update relevant files new architectural changes.
- Whenever a component or config is created, reflect that in the system map.