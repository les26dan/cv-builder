import React from 'react';

interface HobbiesSectionData {
  content: string;
}

interface HobbiesSectionProps {
  data: HobbiesSectionData;
  onUpdate: (data: HobbiesSectionData) => void;
  isActive?: boolean;
}

export const HobbiesSection = ({ data, onUpdate, isActive }: HobbiesSectionProps) => {
  const handleContentChange = (content: string) => {
    onUpdate({ ...data, content });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hobbies & Interests
        </label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
          value={data.content || ''}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Describe your hobbies and interests. Keep it professional and relevant when possible..."
        />
      </div>
      
      <div className="text-sm text-gray-600">
        <p className="mb-2"><strong>Tips for effective hobbies section:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Include hobbies that demonstrate relevant skills or qualities</li>
          <li>Show leadership (team sports captain, club organizer)</li>
          <li>Highlight creativity and problem-solving</li>
          <li>Keep it brief and professional</li>
        </ul>
      </div>
    </div>
  );
};
