
interface ScoreIndicatorProps {
  score: number;
}

export const ScoreIndicator = ({
  score
}: ScoreIndicatorProps) => {
  // Determine color based on score using standardized color system
  const getColor = () => {
    if (score < 40) return '#EF4444'; // Red for low scores
    if (score < 70) return '#F59E0B'; // Orange for medium scores
    return '#22C55E'; // Green for high scores
  };

  const getTextColor = () => {
    if (score < 40) return 'text-red-500';
    if (score < 70) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Progress Bar Container */}
      <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300 ease-in-out"
          style={{
            width: `${score}%`,
            backgroundColor: getColor()
          }}
        />
      </div>
      {/* Score Percentage */}
      <span className={`text-base font-bold ${getTextColor()}`}>
        {score}%
      </span>
    </div>
  );
};