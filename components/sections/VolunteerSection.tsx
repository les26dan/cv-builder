import React from 'react';

interface VolunteerSectionData {
  content: string;
}

interface VolunteerSectionProps {
  data: VolunteerSectionData;
  onUpdate: (data: VolunteerSectionData) => void;
  isActive?: boolean;
}

export const VolunteerSection = ({ data, onUpdate, isActive }: VolunteerSectionProps) => {
  const handleContentChange = (content: string) => {
    onUpdate({ ...data, content });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Volunteer Work
        </label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
          value={data.content || ''}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Describe your volunteer experiences, organizations, roles, and contributions..."
        />
      </div>
    </div>
  );
};