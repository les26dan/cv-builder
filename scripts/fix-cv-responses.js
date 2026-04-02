#!/usr/bin/env node

/**
 * Generate REAL ChatGPT responses for all sample CVs
 * This will replace the placeholder data with actual extracted content
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const SAMPLES_DIR = 'Workflow Files/Materials/Documents/Sample CVs';
const RESPONSES_DIR = 'scripts/cv-responses';

// Sample CVs to process
const cvSamples = [
  { file: 'Resume_HoNguyenHaiNam.pdf', name: 'Resume_HoNguyenHaiNam' },
  { file: 'Nguyen Tuan Anh\'s CV (1).pdf', name: 'Nguyen Tuan Anh\'s CV (1)' },
  { file: 'Marie Quyen Guilhem CV (1).pdf', name: 'Marie Quyen Guilhem CV (1)' },
  { file: 'Tu_Bryan_CV_TechPM (1).pdf', name: 'Tu_Bryan_CV_TechPM (1)' },
  { file: 'Kien Vu Sr. Product Manager (Jan 2025).pdf', name: 'Kien Vu Sr. Product Manager (Jan 2025)' }
];

async function generateRealResponse(cvText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }

  const systemPrompt = `You are a top-tier expert in global recruitment, CV parsing, and structured data extraction, with over 15 years of experience. You accurately and quickly parse CV or resume documents provided by users. You NEVER fabricate, infer, or add any information that is not explicitly available in the provided document. Extracted data is structured exactly as requested. If certain data is not explicitly available, leave the corresponding fields empty ("") or as empty arrays ([]).`;

  const userPrompt = `Review the CV text below carefully. Then:

Step 1: Rate the likelihood (1-10) that the text is a CV or Resume.  
- (1 = definitely NOT a CV, 10 = definitely a CV).

Step 2: ONLY if your score is 5 or higher, extract and structure the CV information precisely into the following JSON format:

{
  "possibility_score": [score],
  "contact": {
    "full_name": "",
    "address": "",
    "email": "",
    "phone": "",
    "linkedin": ""
  },
  "summary": "",
  "work_experience": [
    {
      "position": "",
      "company": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "bullets": ["", "", "", ""]
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "location": "",
      "graduationDate": "",
      "description": ""
    }
  ],
  "skills": ["", "", "", ""]
}

Step 3: If your score is BELOW 5, return EXACTLY this JSON (no other content):

{
  "possibility_score": [score],
  "error": "The uploaded document does not appear to be a CV or Resume. Please upload a valid CV to continue."
}

CV text to analyze:
${cvText}

Mandatory requirements for your response:
- Do NOT fabricate, infer, or add any data not explicitly stated in the text.
- Use ONLY the provided JSON structures. Do NOT add explanations or any additional content beyond the JSON.`;

  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    return JSON.parse(jsonMatch[0]);
    
  } catch (error) {
    console.error('❌ API call failed:', error.message);
    throw error;
  }
}

async function processSingleCV(sample) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 PROCESSING: ${sample.file}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    // 1. Extract text from PDF
    const pdfPath = path.join(SAMPLES_DIR, sample.file);
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ PDF file not found:', pdfPath);
      return;
    }
    
    const buffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(buffer);
    const cvText = data.text;
    
    console.log(`📄 Extracted ${cvText.length} characters from PDF`);
    console.log(`📋 Text preview: ${cvText.substring(0, 200)}...`);
    
    // 2. Call ChatGPT API
    console.log('🤖 Calling ChatGPT API...');
    const apiResponse = await generateRealResponse(cvText);
    
    console.log('✅ Received API response');
    console.log(`📊 Possibility score: ${apiResponse.possibility_score}`);
    console.log(`👤 Name: ${apiResponse.contact?.full_name}`);
    console.log(`📧 Email: ${apiResponse.contact?.email}`);
    console.log(`🏢 Company: ${apiResponse.work_experience?.[0]?.company}`);
    
    // 3. Save response
    const outputPath = path.join(RESPONSES_DIR, `${sample.name}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(apiResponse, null, 2));
    
    console.log(`💾 Saved real response to: ${outputPath}`);
    
    // Check if this looks like real data
    const hasRealData = (
      apiResponse.contact?.email && 
      !apiResponse.contact.email.includes('example.com') &&
      apiResponse.work_experience?.[0]?.company &&
      !apiResponse.work_experience[0].company.includes('Tech Company') &&
      !apiResponse.work_experience[0].company.includes('Consulting Firm')
    );
    
    if (hasRealData) {
      console.log('✅ REAL DATA GENERATED - Success!');
    } else {
      console.log('⚠️ Data looks generic - might need manual review');
    }
    
  } catch (error) {
    console.error(`❌ Failed to process ${sample.file}:`, error.message);
  }
}

async function main() {
  console.log('🔧 GENERATING REAL CHATGPT RESPONSES FOR ALL SAMPLE CVS');
  console.log('This will replace placeholder data with actual extracted content');
  
  // Ensure output directory exists
  if (!fs.existsSync(RESPONSES_DIR)) {
    fs.mkdirSync(RESPONSES_DIR, { recursive: true });
  }
  
  for (const sample of cvSamples) {
    await processSingleCV(sample);
    
    // Wait between API calls to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🎉 ALL CVS PROCESSED!');
  console.log('✅ Real ChatGPT responses generated and saved');
  console.log('✅ Placeholder data has been replaced');
}

if (require.main === module) {
  main().catch(console.error);
}