import React from 'react';

interface CertificationsSectionData {
  content: string;
}

interface CertificationsSectionProps {
  data: CertificationsSectionData;
  onUpdate: (data: CertificationsSectionData) => void;
  isActive?: boolean;
}

export const CertificationsSection = ({ data, onUpdate, isActive }: CertificationsSectionProps) => {
  const handleContentChange = (content: string) => {
    onUpdate({ ...data, content });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Certifications
        </label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
          value={data.content || ''}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="List your certifications, including issuing organizations and dates..."
        />
      </div>
    </div>
  );
};