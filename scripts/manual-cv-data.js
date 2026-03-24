#!/usr/bin/env node

/**
 * Manually processed CV data from ChatGPT API
 * This allows us to quickly populate test sites without running the full API
 */

const fs = require('fs');
const path = require('path');

// Manually processed CV data (to be filled with actual ChatGPT responses)
const cvData = {
  'ho-nguyen-hai-nam': {
    file: 'Resume_HoNguyenHaiNam.pdf',
    displayName: 'Ho Nguyen Hai Nam',
    jsonData: {
      "possibility_score": 10,
      "contact": {
        "full_name": "Ho Nguyen Hai Nam",
        "address": "237/18 Hoang Dieu Road, Ward 8, District 4, TP. Ho Chi Minh",
        "email": "honguyenhainam1996@gmail.com",
        "phone": "+84 908 406 514",
        "linkedin": ""
      },
      "summary": "Results-oriented quality assurance tester with 4+ years of expertise in ensuring long-term product quality with high stability and quick application development life cycles. Ability to learn quickly, often in high-pressure situations in order to fully understand a new product.",
      "work_experience": [
        {
          "position": "QA/QC Trainee",
          "company": "KMS Technology",
          "location": "",
          "start_date": "2018",
          "end_date": "2019",
          "bullets": [
            "Participated in many crucial projects that brought the company's name and success",
            "Proficiency in SQL, Postman, Confluence, TestRail, IntelliJ and Google Office"
          ]
        }
      ],
      "education": [
        {
          "degree": "Professional Bachelor of Computer Technology",
          "institution": "ITA, Asia E University",
          "location": "Kuala Lumpur, Malaysia",
          "graduationDate": "2013",
          "description": "GPA 3.67"
        }
      ],
      "skills": ["Quality Control", "Quality Assurance", "Documentation Analyst", "Database query", "Performance manual test", "Emulator Testing"]
    }
  },
  'nguyen-tuan-anh': {
    file: 'Nguyen Tuan Anh\'s CV (1).pdf',
    displayName: 'Nguyen Tuan Anh',
    jsonData: {
      "possibility_score": 8,
      "contact": {
        "full_name": "Nguyen Tuan Anh",
        "address": "Hanoi, Vietnam",
        "email": "tuananh@email.com",
        "phone": "+84 987 654 321",
        "linkedin": "linkedin.com/in/nguyentuananh"
      },
      "summary": "Business analyst with strong analytical skills and project management experience.",
      "work_experience": [
        {
          "position": "Business Analyst",
          "company": "Consulting Firm",
          "location": "Hanoi",
          "start_date": "Mar 2019",
          "end_date": "Present",
          "bullets": [
            "Analyzed business requirements",
            "Created detailed documentation",
            "Coordinated with stakeholders"
          ]
        }
      ],
      "education": [
        {
          "degree": "Bachelor of Business Administration",
          "institution": "Hanoi University",
          "location": "Hanoi",
          "graduationDate": "2019",
          "description": "Major: Business Analysis"
        }
      ],
      "skills": ["Excel", "SQL", "PowerBI", "Project Management", "Data Analysis"]
    }
  },
  'marie-quyen-guilhem': {
    file: 'Marie Quyen Guilhem CV (1).pdf',
    displayName: 'Marie Quyen Guilhem',
    jsonData: {
      "possibility_score": 9,
      "contact": {
        "full_name": "Marie Quyen Guilhem",
        "address": "Paris, France",
        "email": "marie.guilhem@email.com",
        "phone": "+33 1 23 45 67 89",
        "linkedin": "linkedin.com/in/mariequyenguilhem"
      },
      "summary": "International marketing professional with expertise in digital marketing and brand management.",
      "work_experience": [
        {
          "position": "Marketing Manager",
          "company": "International Brand",
          "location": "Paris",
          "start_date": "Jun 2018",
          "end_date": "Present",
          "bullets": [
            "Developed global marketing strategies",
            "Managed digital marketing campaigns",
            "Increased brand awareness by 40%"
          ]
        }
      ],
      "education": [
        {
          "degree": "Master in Marketing",
          "institution": "ESSEC Business School",
          "location": "Paris",
          "graduationDate": "2018",
          "description": "Specialization: Digital Marketing"
        }
      ],
      "skills": ["Digital Marketing", "Brand Management", "SEO", "Analytics", "French", "English"]
    }
  },
  'tu-bryan': {
    file: 'Tu_Bryan_CV_TechPM (1).pdf',
    displayName: 'Tu Bryan',
    jsonData: {
      "possibility_score": 9,
      "contact": {
        "full_name": "Tu Bryan",
        "address": "San Francisco, USA",
        "email": "tu.bryan@email.com",
        "phone": "+1 555 123 4567",
        "linkedin": "linkedin.com/in/tubryan"
      },
      "summary": "Technical Product Manager with experience in agile development and product strategy.",
      "work_experience": [
        {
          "position": "Senior Technical Product Manager",
          "company": "Tech Startup",
          "location": "San Francisco",
          "start_date": "Jan 2020",
          "end_date": "Present",
          "bullets": [
            "Led product development for mobile app",
            "Coordinated cross-functional teams",
            "Defined product roadmap and strategy"
          ]
        }
      ],
      "education": [
        {
          "degree": "Master of Science in Computer Science",
          "institution": "Stanford University",
          "location": "Stanford, CA",
          "graduationDate": "2018",
          "description": "Focus: Human-Computer Interaction"
        }
      ],
      "skills": ["Product Management", "Agile", "Scrum", "Technical Strategy", "Data Analysis"]
    }
  },
  'kien-vu': {
    file: 'Kien Vu Sr. Product Manager (Jan 2025).pdf',
    displayName: 'Kien Vu',
    jsonData: {
      "possibility_score": 9,
      "contact": {
        "full_name": "Kien Vu",
        "address": "Ho Chi Minh City, Vietnam",
        "email": "kien.vu@email.com",
        "phone": "+84 901 234 567",
        "linkedin": "linkedin.com/in/kienvu"
      },
      "summary": "Senior Product Manager with extensive experience in fintech and mobile applications.",
      "work_experience": [
        {
          "position": "Senior Product Manager",
          "company": "Fintech Company",
          "location": "Ho Chi Minh City",
          "start_date": "Apr 2019",
          "end_date": "Present",
          "bullets": [
            "Managed fintech product portfolio",
            "Launched mobile payment solutions",
            "Achieved 200% user growth"
          ]
        }
      ],
      "education": [
        {
          "degree": "MBA",
          "institution": "RMIT University Vietnam",
          "location": "Ho Chi Minh City",
          "graduationDate": "2019",
          "description": "Concentration: Technology Management"
        }
      ],
      "skills": ["Product Management", "Fintech", "Mobile Apps", "Strategy", "Analytics"]
    }
  }
};

/**
 * Update test site with CV data
 */
function updateTestSite(cvName, cvInfo) {
  console.log(`📝 Updating test site for: ${cvInfo.displayName}`);
  
  const siteDir = `app/cv-uploaded-test/${cvName}`;
  if (!fs.existsSync(siteDir)) {
    console.error(`❌ Test site directory not found: ${siteDir}`);
    return false;
  }
  
  // Read current page content
  const pagePath = path.join(siteDir, 'page.tsx');
  let pageContent = fs.readFileSync(pagePath, 'utf8');
  
  // Replace placeholder data with real data
  const placeholderPattern = /const testLLMData = \{[\s\S]*?\};/;
  const replacement = `const testLLMData = ${JSON.stringify(cvInfo.jsonData, null, 4)};`;
  
  pageContent = pageContent.replace(placeholderPattern, replacement);
  
  // Write updated content
  fs.writeFileSync(pagePath, pageContent);
  console.log(`✅ Updated test site: /cv-uploaded-test/${cvName}`);
  
  // Also save JSON data for reference
  const jsonPath = `scripts/cv-responses/${cvInfo.file.replace(/\.pdf$/i, '.json')}`;
  fs.writeFileSync(jsonPath, JSON.stringify(cvInfo.jsonData, null, 2));
  console.log(`💾 Saved JSON data: ${jsonPath}`);
  
  return true;
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Updating all CV test sites with sample data...\n');
  
  let successCount = 0;
  
  // Update each CV test site
  for (const [cvName, cvInfo] of Object.entries(cvData)) {
    if (updateTestSite(cvName, cvInfo)) {
      successCount++;
    }
  }
  
  console.log(`\n✅ Updated ${successCount}/${Object.keys(cvData).length} test sites!`);
  console.log('\n🌐 Available test sites:');
  console.log('  - http://localhost:3000/cv-uploaded-test/ (index)');
  console.log('  - http://localhost:3000/cv-uploaded-test/manroe (original)');
  
  for (const cvName of Object.keys(cvData)) {
    console.log(`  - http://localhost:3000/cv-uploaded-test/${cvName}`);
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Replace sample data with actual ChatGPT API responses');
  console.log('2. Test each site to ensure proper data flow');
  console.log('3. Verify pagination improvements with different CV layouts');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { cvData, updateTestSite };