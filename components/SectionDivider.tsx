import React from 'react';

interface SectionDividerProps {
  activeIndex?: number; // 0, 1, 2 for which dot should be active
}

const SectionDivider: React.FC<SectionDividerProps> = ({ activeIndex = 0 }) => {
  return (
    <div className="w-full h-10 bg-white">
      {/* Empty divider - 3-dot navigation removed per UI polish requirements */}
    </div>
  );
};

export default SectionDivider; 