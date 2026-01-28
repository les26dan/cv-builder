import React, { useState, useEffect } from 'react';
import { AIAssistButton } from '../common/AIAssistButton';
import { XIcon } from 'lucide-react';
import { aiService } from '../../utils/aiService';
import { getTexts } from '../../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../../config/languageConfig';

interface SkillsSectionProps {
  data: {
    items: string[];
  };
  onUpdate: (data: any) => void;
  isActive: boolean;
  cvData?: any;
  language?: SupportedLanguage;
}

interface ValidationState {
  error: string;
  warning: string;
}

export const SkillsSection = ({
  data,
  onUpdate,
  isActive: _isActive,
  cvData,
  language
}: SkillsSectionProps) => {
  const [newSkill, setNewSkill] = useState('');
  const [validation, setValidation] = useState<ValidationState>({ error: '', warning: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Language and text configuration
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [skillsTexts, setSkillsTexts] = useState<any>(null);
  
  // Load language configuration
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage;
        const effectiveLanguage = language || savedLanguage || detectLanguage().language;
        
        setCurrentLanguage(effectiveLanguage);
        const texts = await getTexts('cvEditor', effectiveLanguage);
        setSkillsTexts(texts.sections.skills);
      } catch (error) {
        console.error('Failed to load skills texts:', error);
        setCurrentLanguage('en');
      }
    };
    
    loadLanguage();
  }, [language]);

  const validateSkill = (skill: string): ValidationState => {
    const trimmedSkill = skill.trim();
    
    if (!trimmedSkill) {
      return { error: '', warning: '' };
    }

    // Check for duplicates (case-insensitive)
    const isDuplicate = data.items.some(existingSkill => 
      existingSkill.toLowerCase() === trimmedSkill.toLowerCase()
    );
    
    if (isDuplicate) {
      return { error: 'This skill has already been added', warning: '' };
    }

    // Check length (warn if too long)
    if (trimmedSkill.length > 50) {
      return { error: 'Skill too long, please shorten (max 50 characters)', warning: '' };
    }

    if (trimmedSkill.length > 30) {
      return { error: '', warning: 'This skill is a bit long, consider shortening' };
    }

    return { error: '', warning: '' };
  };

  const handleSkillChange = (value: string) => {
    setNewSkill(value);
    
    // Clear validation on input if user is typing
    if (validation.error || validation.warning) {
      const newValidation = validateSkill(value);
      setValidation(newValidation);
    }
  };

  const handleAddSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (!trimmedSkill) return;

    const validation = validateSkill(trimmedSkill);
    
    if (validation.error) {
      setValidation(validation);
      return;
    }

    // Add skill if validation passes
    onUpdate({
      ...data,
      items: [...data.items, trimmedSkill]
    });
    
    setNewSkill('');
    setValidation({ error: '', warning: '' });
  };

  const handleRemoveSkill = (index: number) => {
    const updatedItems = [...data.items];
    updatedItems.splice(index, 1);
    onUpdate({
      ...data,
      items: updatedItems
    });
  };

  const handleClearAllSkills = () => {
    if (window.confirm('Are you sure you want to remove all skills? This action cannot be undone.')) {
      onUpdate({
        ...data,
        items: []
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleBlur = () => {
    if (newSkill.trim()) {
      const validation = validateSkill(newSkill.trim());
      setValidation(validation);
    }
  };

  const handleGenerateSkills = async () => {
    setIsGenerating(true);
    try {
      // Prepare enhanced context for AI skill suggestions
      const workExperience = cvData?.experience?.items || [];
      const education = cvData?.education?.items || [];
      const targetJob = cvData?.targetJobDescription || '';
      
      // Determine industry from work experience or education
      const industry = workExperience.length > 0 
        ? workExperience[0]?.company 
        : education.length > 0 
        ? education[0]?.field || education[0]?.degree 
        : '';
      
      // Get most recent job title
      const jobTitle = workExperience.length > 0 ? workExperience[0]?.title : '';

      // Detect language from CV content
      const cvContent = {
        summary: cvData?.summary?.content || '',
        experience: workExperience,
        skills: data.items,
        education: education
      };
      
      // Combine text content for language detection
      const combinedText = [
        cvContent.summary,
        workExperience.map((exp: any) => `${exp.title} ${exp.company} ${exp.bullets?.join(' ') || ''}`).join(' '),
        data.items.join(' '),
        education.map((edu: any) => `${edu.degree} ${edu.institution || edu.school || ''}`).join(' '),
        targetJob
      ].join(' ');
      
      // Simple Vietnamese detection - if contains Vietnamese characters, use Vietnamese
      const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(combinedText) ||
                         /\b(và|của|trong|với|từ|cho|để|này|đó|có|được|không|tại|về|theo|đã|sẽ|đang|các|một|những|nhiều|tốt|kinh nghiệm|công ty|dự án|phát triển|quản lý|tham gia|thực hiện|đạt được|chịu trách nhiệm|kỹ năng|chuyên viên|quản lý|giám đốc|trưởng phòng|nhân viên|thực tập sinh|lập trình viên|thiết kế|kinh doanh|marketing|tài chính|nhân sự|bán hàng)\b/i.test(combinedText);

      // Debug logging
      console.log('🔍 Language Detection Debug:', {
        combinedText: combinedText.substring(0, 200) + '...',
        isVietnamese,
        currentSkillsCount: data.items.length,
        maxAllowed: 8
      });

      // Calculate how many skills we can suggest (max 8 total)
      const maxSkills = Math.max(0, 8 - data.items.length);
      
      // If already at max skills, show warning
      if (maxSkills === 0) {
        setValidation({ error: '', warning: 'Reached limit of 8 skills. Please remove less important skills before adding new ones.' });
        setTimeout(() => setValidation({ error: '', warning: '' }), 5000);
        return;
      }
      
      const result = await aiService.suggestSkills({
        currentSkills: data.items,
        workExperience,
        education,
        targetJobDescription: targetJob,
        industry,
        jobTitle,
        language: isVietnamese ? 'vi' : 'en',
        maxSkillsToSuggest: maxSkills
      });

      if (result.success && result.data) {
        // Filter out skills that already exist (case-insensitive)
        const newSkills = result.data.filter(skill => 
          !data.items.some(existingSkill => 
            existingSkill.toLowerCase() === skill.toLowerCase()
          )
        );
        
        if (newSkills.length === 0) {
          setValidation({ error: '', warning: 'All suggested skills are already in the list' });
          setTimeout(() => setValidation({ error: '', warning: '' }), 3000);
          return;
        }

        onUpdate({
          ...data,
          items: [...data.items, ...newSkills]
        });

        // Mark AI as used for score calculation (will be implemented)
        // markAIUsed('skills');
      } else {
        console.error('Failed to generate skills:', result.error);
        alert(skillsTexts?.validation?.generateError || 'Unable to generate skill suggestions. Please try again.');
      }
    } catch (error) {
      console.error('Error generating skills:', error);
      alert(skillsTexts?.validation?.generalError || 'An error occurred while generating skill suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getInputClassName = () => {
    if (validation.error) {
      return 'flex-1 p-2 border border-red-300 bg-red-50 rounded-l-md focus:outline-none focus:ring-2 focus:ring-red-200';
    }
    if (validation.warning) {
      return 'flex-1 p-2 border border-yellow-300 bg-yellow-50 rounded-l-md focus:outline-none focus:ring-2 focus:ring-yellow-200';
    }
    return 'flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-200';
  };

  return (
    <div className="space-y-4">
      {/* Header with instruction and clear all button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {skillsTexts?.guidance || 'Choose 5-10 skills most relevant to the position you\'re applying for.'}
        </p>
        
        {/* Clear All Button - positioned at top right */}
        {data?.items && data.items.length > 0 && (
          <button
            onClick={handleClearAllSkills}
            className="px-3 py-1 text-sm bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 rounded-md border border-red-300 transition-colors duration-200 flex items-center gap-1 shrink-0"
            title={skillsTexts?.clearAllTitle || 'Remove all skills'}
          >
            <XIcon size={14} />
            {skillsTexts?.clearAll || 'Clear All'} ({data.items.length})
          </button>
        )}
      </div>
      
      {/* Skills Display */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(data?.items || []).map((skill: any, index) => {
          const skillName = typeof skill === 'object' && skill.name ? skill.name : skill;
          return (
            <div key={`skill-${skillName}-${index}`} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {/* Handle both string arrays and skill objects */}
              {skillName}
              <button 
                className="ml-1 text-blue-600 hover:text-blue-800" 
                onClick={() => handleRemoveSkill(index)}
                title="Xóa kỹ năng này"
              >
                <XIcon size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Skill Input */}
      <div>
        <div className="flex">
          <input 
            type="text" 
            className={getInputClassName()}
            value={newSkill} 
            onChange={e => handleSkillChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={skillsTexts?.placeholder || 'Add skills... (e.g., Python, Time Management, Adobe Photoshop)'}
            aria-invalid={!!validation.error}
            maxLength={60} // Prevent extremely long input
          />
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed" 
            onClick={handleAddSkill}
            disabled={!!validation.error || !newSkill.trim()}
          >
            {skillsTexts?.addSkill || 'Add'}
          </button>
        </div>
        
        {/* Validation Messages */}
        {validation.error && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <span className="mr-1">⚠️</span>
            {validation.error}
          </div>
        )}
        
        {validation.warning && !validation.error && (
          <div className="mt-2 flex items-center text-yellow-600 text-sm">
            <span className="mr-1">⚠️</span>
            {validation.warning}
          </div>
        )}
        
        {newSkill.length > 0 && !validation.error && !validation.warning && (
          <div className="mt-1 text-xs text-gray-500">
            {newSkill.length}/50 ký tự
          </div>
        )}
      </div>

      {/* AI Button - Only the skill suggestion feature remains */}
      <div className="flex gap-2">
        <AIAssistButton 
          label={skillsTexts?.aiSuggestions || 'Skill Suggestions'} 
          onClick={handleGenerateSkills}
          disabled={isGenerating}
        />
      </div>
    </div>
  );
};