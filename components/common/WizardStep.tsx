import React, { ReactNode } from 'react';
import { SparklesIcon } from 'lucide-react';

interface WizardStepProps {
  title: string;
  description: string;
  children: ReactNode;
  showAIBadge?: boolean;
  aiBadgeTitle?: string;
  aiBadgeDescription?: string;
}

export const WizardStep: React.FC<WizardStepProps> = ({
  title,
  description,
  children,
  showAIBadge = false,
  aiBadgeTitle = '',
  aiBadgeDescription = ''
}) => {
  return (
    <div className="space-y-4">
      {showAIBadge && (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex items-start gap-3">
          <div className="mt-0.5">
            <SparklesIcon className="h-5 w-5 text-[#0277BD]" />
          </div>
          <div>
            <h3 className="font-medium text-[#0277BD]">
              {aiBadgeTitle}
            </h3>
            <p className="text-sm text-gray-600">
              {aiBadgeDescription}
            </p>
          </div>
        </div>
      )}
      <div>
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
        {description && <p className="text-gray-500 text-sm">{description}</p>}
      </div>
      {children}
    </div>
  );
};
