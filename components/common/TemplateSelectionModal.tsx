import React, { useState, useEffect } from 'react';
import { XIcon, PlusIcon } from 'lucide-react';
import { getTexts } from '../../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../../config/languageConfig';

interface Template {
  id: string;
  title: string;
  content: string;
  example: string;
}

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  jobTitle?: string;
  language?: SupportedLanguage;
}

export const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  jobTitle,
  language
}) => {
  // Language and text configuration
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [templateTexts, setTemplateTexts] = useState<any>(null);
  const [bulletTemplates, setBulletTemplates] = useState<Template[]>([]);
  
  // Load language configuration
  useEffect(() => {
    const loadLanguageAndTemplates = async () => {
      try {
        const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage;
        const effectiveLanguage = language || savedLanguage || detectLanguage().language;
        
        setCurrentLanguage(effectiveLanguage);
        const texts = await getTexts('cvEditor', effectiveLanguage);
        setTemplateTexts(texts.sections.experience.bullets.templateSelection);
        
        // Create bullet templates from text configuration
        const templates = texts.sections.experience.bullets.templateSelection.templates;
        const templateKeys = ['achievement', 'implementation', 'improvement', 'collaboration', 'management', 'problemSolving'];
        
        const loadedTemplates: Template[] = templateKeys.map(key => ({
          id: key,
          title: templates[key]?.title || key,
          content: templates[key]?.content || '',
          example: templates[key]?.example || ''
        }));
        
        setBulletTemplates(loadedTemplates);
      } catch (error) {
        console.error('Failed to load template texts:', error);
        setCurrentLanguage('en');
        // Fallback templates
        setBulletTemplates([
          {
            id: 'achievement',
            title: 'Achievement with results',
            content: 'Led [team/project] to [achieve goal], resulting in [specific impact].',
            example: 'Led team of 5 engineers to deploy new CRM system, resulting in 30% improved efficiency.'
          }
        ]);
      }
    };
    
    loadLanguageAndTemplates();
  }, [language]);
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-testid="modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-label={templateTexts?.title || 'Choose bullet template'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="text-primary-500">
              <PlusIcon size={24} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {templateTexts?.title || 'Choose bullet template'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={templateTexts?.closeLabel || 'Close'}
          >
            <XIcon size={24} />
          </button>
        </div>

        {/* Description */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <p className="text-sm text-gray-600">
            {templateTexts?.description || 'Choose a template that fits your experience. You can fill in the parts [in brackets] with your specific information.'}
          </p>
          {jobTitle && (
            <p className="text-sm text-primary-600 mt-1">
              {templateTexts?.jobTitleHint || 'Suggestion for position:'} <span className="font-medium">{jobTitle}</span>
            </p>
          )}
        </div>

        {/* Templates */}
        <div className="p-6 space-y-4">
          {bulletTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900">{template.title}</h3>
                <button className="text-primary-500 hover:text-primary-600 flex items-center gap-1 text-sm">
                  <PlusIcon size={16} />
                  {templateTexts?.selectButton || 'Select'}
                </button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  {template.content}
                </p>
                <div className="border-l-4 border-primary-200 pl-3">
                  <p className="text-xs text-gray-500 mb-1">{templateTexts?.exampleLabel || 'Example:'}</p>
                  <p className="text-sm text-gray-700">{template.example}</p>
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
}; 