import React from 'react';

interface LanguagesSectionData {
  content: string;
}

interface LanguagesSectionProps {
  data: LanguagesSectionData;
  onUpdate: (data: LanguagesSectionData) => void;
  isActive?: boolean;
}

export const LanguagesSection = ({ data, onUpdate, isActive }: LanguagesSectionProps) => {
  const handleContentChange = (content: string) => {
    onUpdate({ ...data, content });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages
        </label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
          value={data.content || ''}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="List languages and proficiency levels (e.g., English - Native, Spanish - Conversational)..."
        />
      </div>
    </div>
  );
};