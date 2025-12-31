import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface KeywordAnalysisSectionProps {
  matchedKeywords: string[];
  missingKeywords: {
    highPriority: string[];
    mediumPriority: string[];
  };
  language?: 'vi' | 'en';
  className?: string;
}

export const KeywordAnalysisSection: React.FC<KeywordAnalysisSectionProps> = ({
  matchedKeywords = [],
  missingKeywords = { highPriority: [], mediumPriority: [] },
  language = 'vi',
  className = ''
}) => {
  // Calculate totals - focus only on high priority missing keywords
  const totalMatched = matchedKeywords.length;
  const totalMissing = missingKeywords.highPriority.length;
  
  // Text configurations
  const texts = {
    vi: {
      matchedTitle: `${totalMatched} keyword quan trọng được tìm thấy`,
      matchedSubtitle: `CV của bạn đã có các keyword sau:`,
      missingTitle: `${totalMissing} keyword quan trọng còn thiếu`,
      missingSubtitle: `CV của bạn còn thiếu các keyword sau:`
    },
    en: {
      matchedTitle: `${totalMatched} important keywords found`,
      matchedSubtitle: `Your CV already has these keywords:`,
      missingTitle: `${totalMissing} important keywords missing`,
      missingSubtitle: `Your CV is missing these keywords:`
    }
  };

  const t = texts[language];

  // Don't render if no data
  if (totalMatched === 0 && totalMissing === 0) {
    return null;
  }

  return (
    <div className={`flex flex-row gap-4 ${className}`}>
      
      {/* Missing Keywords Section - Left Side */}
      {totalMissing > 0 && (
        <div className="flex flex-col items-start gap-4 flex-1 p-4 rounded-lg border" style={{ backgroundColor: '#FEF3F2', borderColor: '#FCA5A5' }}>
          {/* Missing Header */}
          <div className="flex flex-row items-center gap-3 w-full">
            {/* Warning Icon */}
            <div className="flex flex-col justify-center items-center w-8 h-8 rounded-lg" style={{ backgroundColor: '#DC2626' }}>
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>

            {/* Missing Info */}
            <div className="flex flex-col items-start gap-1">
              <h3 className="text-base font-semibold leading-5 text-red-600">
                {t.missingTitle}
              </h3>
              <p className="text-sm font-normal leading-4 text-red-600">
                {t.missingSubtitle}
              </p>
            </div>
          </div>

          {/* Missing Keywords Pills - Ultra compact */}
          {missingKeywords.highPriority.length > 0 && (
            <div className="flex flex-row flex-wrap items-start gap-1.5 w-full">
              {missingKeywords.highPriority.map((keyword, index) => (
                <div
                  key={`missing-high-${index}`}
                  className="flex flex-row justify-center items-center px-2 py-1 gap-1 bg-white border border-red-300 rounded-full"
                >
                  {/* Priority Dot - Ultra small */}
                  <div className="w-1 h-1 bg-red-600 rounded-full"></div>
                  
                  {/* Keyword Text - Ultra small */}
                  <span className="text-xs font-medium text-red-600">
                    {keyword}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Matched Keywords Section - Right Side */}
      {totalMatched > 0 && (
        <div className="flex flex-col items-start gap-4 flex-1 p-4 rounded-lg border" style={{ backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }}>
          {/* Matched Header */}
          <div className="flex flex-row items-center gap-3 w-full">
            {/* Success Icon */}
            <div className="flex flex-col justify-center items-center w-8 h-8 rounded-lg" style={{ backgroundColor: '#16A34A' }}>
              <CheckCircle className="w-4 h-4 text-white" />
            </div>

            {/* Matched Info */}
            <div className="flex flex-col items-start gap-1">
              <h3 className="text-base font-semibold leading-5 text-green-600">
                {t.matchedTitle}
              </h3>
              <p className="text-sm font-normal leading-4 text-green-600">
                {t.matchedSubtitle}
              </p>
            </div>
          </div>

          {/* Matched Keywords Pills - Ultra compact */}
          <div className="flex flex-row flex-wrap items-start gap-1.5 w-full">
            {matchedKeywords.map((keyword, index) => (
              <div
                key={`matched-${index}`}
                className="flex flex-row justify-center items-center px-2 py-1 gap-1 bg-white border border-green-300 rounded-full"
              >
                {/* Check Icon - Ultra small */}
                <CheckCircle className="w-2.5 h-2.5 text-green-600" />
                
                {/* Keyword Text - Ultra small */}
                <span className="text-xs font-medium text-green-600">
                  {keyword}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordAnalysisSection; 