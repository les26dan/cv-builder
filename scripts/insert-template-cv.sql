-- Insert template CV for guided editing
-- Template ID: template-1770903803894
-- This creates a sample CV that users can start with

INSERT INTO cv_workflow (
  id,
  user_id,
  title,
  status,
  score,
  cv_data,
  workflow_current_step,
  workflow_steps_completed,
  workflow_last_active_step,
  workflow_time_spent,
  auto_save_enabled,
  ai_assistance_enabled,
  template_name,
  language,
  version,
  source,
  created_at,
  updated_at
) VALUES (
  'template-1770903803894',
  '00000000-0000-0000-0000-000000000000', -- Placeholder user_id (update with actual user ID)
  'Professional Software Engineer Template',
  'draft',
  75,
  '{
    "id": "template-1770903803894",
    "userId": "00000000-0000-0000-0000-000000000000",
    "title": "Professional Software Engineer Template",
    "status": "draft",
    "score": 75,
    "contact": {
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1 (555) 123-4567",
      "location": "San Francisco, CA",
      "linkedin": "linkedin.com/in/johndoe"
    },
    "summary": {
      "content": "Experienced Software Engineer with 5+ years of expertise in full-stack development, cloud architecture, and agile methodologies. Proven track record of delivering scalable solutions and leading cross-functional teams. Passionate about clean code, performance optimization, and user experience."
    },
    "experience": {
      "items": [
        {
          "id": "exp-1",
          "title": "Senior Software Engineer",
          "company": "Tech Corp Inc.",
          "location": "San Francisco, CA",
          "startDate": "2021-03",
          "endDate": "",
          "current": true,
          "bullets": [
            "Led development of microservices architecture serving 1M+ users, improving system reliability by 40%",
            "Implemented CI/CD pipelines reducing deployment time from hours to minutes",
            "Mentored junior developers and conducted code reviews maintaining 95% code quality standards",
            "Architected RESTful APIs and GraphQL endpoints used by web and mobile applications"
          ]
        },
        {
          "id": "exp-2",
          "title": "Software Engineer",
          "company": "StartupXYZ",
          "location": "San Francisco, CA",
          "startDate": "2019-01",
          "endDate": "2021-02",
          "current": false,
          "bullets": [
            "Developed full-stack features using React, Node.js, and PostgreSQL for B2B SaaS platform",
            "Optimized database queries reducing response time by 60% and improving user experience",
            "Collaborated with product and design teams to deliver features on tight deadlines",
            "Implemented automated testing achieving 85% code coverage"
          ]
        },
        {
          "id": "exp-3",
          "title": "Junior Developer",
          "company": "Digital Solutions Ltd.",
          "location": "New York, NY",
          "startDate": "2017-06",
          "endDate": "2018-12",
          "current": false,
          "bullets": [
            "Built responsive web applications using modern JavaScript frameworks",
            "Participated in agile ceremonies and sprint planning",
            "Fixed bugs and implemented feature requests based on user feedback"
          ]
        }
      ]
    },
    "skills": {
      "items": [
        "JavaScript/TypeScript",
        "React.js",
        "Node.js",
        "Python",
        "PostgreSQL",
        "MongoDB",
        "AWS",
        "Docker",
        "Kubernetes",
        "GraphQL",
        "REST APIs",
        "CI/CD",
        "Git",
        "Agile/Scrum"
      ]
    },
    "education": {
      "items": [
        {
          "id": "edu-1",
          "degree": "Bachelor of Science in Computer Science",
          "institution": "University of California",
          "location": "Berkeley, CA",
          "graduationDate": "2017-05",
          "description": "GPA: 3.7/4.0. Focus on Software Engineering and Algorithms."
        }
      ]
    },
    "workflow": {
      "currentStep": "editing",
      "stepsCompleted": ["upload"],
      "lastActiveStep": "editing",
      "timeSpent": 0
    },
    "metadata": {
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "version": 1,
      "source": "template"
    },
    "settings": {
      "autoSave": true,
      "aiAssistance": true,
      "template": "default",
      "language": "en"
    },
    "sectionOrder": ["contact", "summary", "experience", "skills", "education"]
  }'::jsonb,
  'editing',
  ARRAY['upload'],
  'editing',
  0,
  true,
  true,
  'default',
  'en',
  1,
  'template',
  NOW(),
  NOW()
);

-- Verify the insertion
SELECT id, title, status, source FROM cv_workflow WHERE id = 'template-1770903803894';
