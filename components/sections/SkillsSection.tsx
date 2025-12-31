import React, { useState } from 'react';
import { AIAssistButton } from '../common/AIAssistButton';
import { XIcon } from 'lucide-react';
import { aiService } from '../../utils/aiService';

interface SkillsSectionProps {
  data: {
    items: string[];
  };
  onUpdate: (data: any) => void;
  isActive: boolean;
  cvData?: any;
}

interface ValidationState {
  error: string;
  warning: string;
}

export const SkillsSection = ({
  data,
  onUpdate,
  isActive: _isActive,
  cvData
}: SkillsSectionProps) => {
  const [newSkill, setNewSkill] = useState('');
  const [validation, setValidation] = useState<ValidationState>({ error: '', warning: '' });
  const [isGenerating, setIsGenerating] = useState(false);

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
      return { error: 'Kỹ năng này đã được thêm', warning: '' };
    }

    // Check length (warn if too long)
    if (trimmedSkill.length > 50) {
      return { error: 'Kỹ năng quá dài, vui lòng rút gọn (tối đa 50 ký tự)', warning: '' };
    }

    if (trimmedSkill.length > 30) {
      return { error: '', warning: 'Kỹ năng này hơi dài, hãy cân nhắc rút gọn' };
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
        setValidation({ error: '', warning: 'Đã đạt giới hạn 8 kỹ năng. Vui lòng xóa bớt kỹ năng ít quan trọng trước khi thêm mới.' });
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
          setValidation({ error: '', warning: 'Tất cả kỹ năng gợi ý đã có trong danh sách' });
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
        alert('Không thể tạo gợi ý kỹ năng. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error generating skills:', error);
      alert('Có lỗi xảy ra khi tạo gợi ý kỹ năng. Vui lòng thử lại.');
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
      <p className="text-sm text-gray-600">
        Chọn 5-10 kỹ năng phù hợp nhất với vị trí ứng tuyển.
      </p>
      
      {/* Skills Display */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(data?.items || []).map((skill, index) => (
          <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            {skill}
            <button 
              className="ml-1 text-blue-600 hover:text-blue-800" 
              onClick={() => handleRemoveSkill(index)}
              title="Xóa kỹ năng này"
            >
              <XIcon size={14} />
            </button>
          </div>
        ))}
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
            placeholder="Thêm kỹ năng... (ví dụ: Python, Kỹ năng quản lý thời gian, Adobe Photoshop)"
            aria-invalid={!!validation.error}
            maxLength={60} // Prevent extremely long input
          />
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed" 
            onClick={handleAddSkill}
            disabled={!!validation.error || !newSkill.trim()}
          >
            Thêm
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
          label="Gợi ý kỹ năng" 
          onClick={handleGenerateSkills}
          disabled={isGenerating}
        />
      </div>
    </div>
  );
};