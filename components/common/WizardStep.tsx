import React, { ReactNode } from 'react';
import { SparklesIcon } from 'lucide-react';

interface WizardStepProps {
  title: string;
  description: string;
  children: ReactNode;
  showAIBadge?: boolean;
}

export const WizardStep: React.FC<WizardStepProps> = ({
  title,
  description,
  children,
  showAIBadge = false
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
              Tạo mô tả công việc với AI
            </h3>
            <p className="text-sm text-gray-600">
              AI sẽ giúp bạn tạo gạch đầu dòng chuyên nghiệp dựa trên thông tin
              bạn cung cấp.
            </p>
          </div>
        </div>
      )}
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
      {children}
    </div>
  );
};
