import React from 'react';

interface SectionDividerProps {
  activeIndex?: number; // 0, 1, 2 for which dot should be active
}

const SectionDivider: React.FC<SectionDividerProps> = ({ activeIndex = 0 }) => {
  return (
    <div className="flex flex-row justify-center items-center w-full h-10 bg-white">
      <div className="flex flex-row justify-center items-center gap-4 w-[120px] h-2">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded ${
              index === activeIndex ? 'bg-[#0288D1]' : 'bg-[#B2EBF2]'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default SectionDivider; 