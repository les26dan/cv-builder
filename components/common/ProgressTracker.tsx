/**
 * Progress Tracker Component
 * Task 5: Enhanced progress tracking with animations and celebrations
 * Following CV Builder development tenets - smooth UX with gamification elements
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, CheckCircle, Star, Sparkles } from 'lucide-react';

interface ProgressTrackerProps {
  currentScore: number;
  previousScore: number;
  totalSuggestions: number;
  appliedSuggestions: number;
  language?: 'vi' | 'en';
  showCelebration?: boolean;
  onCelebrationComplete?: () => void;
  className?: string;
}

interface Milestone {
  score: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentScore,
  previousScore,
  totalSuggestions,
  appliedSuggestions,
  language = 'vi',
  showCelebration = false,
  onCelebrationComplete,
  className = ''
}) => {
  const [animatedScore, setAnimatedScore] = useState(previousScore);
  const [isAnimating, setIsAnimating] = useState(false);
  const [achievedMilestone, setAchievedMilestone] = useState<Milestone | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  const milestones: Milestone[] = [
    {
      score: 50,
      title: language === 'vi' ? 'Bước đầu tốt!' : 'Good Start!',
      description: language === 'vi' ? 'CV của bạn đã có nền tảng tốt' : 'Your CV has a good foundation',
      icon: <Star className="w-6 h-6" />,
      color: 'from-yellow-400 to-orange-500'
    },
    {
      score: 75,
      title: language === 'vi' ? 'CV chất lượng cao!' : 'High Quality CV!',
      description: language === 'vi' ? 'CV của bạn đã đạt tiêu chuẩn cao' : 'Your CV meets high standards',
      icon: <Target className="w-6 h-6" />,
      color: 'from-blue-400 to-blue-600'
    },
    {
      score: 90,
      title: language === 'vi' ? 'CV xuất sắc!' : 'Excellent CV!',
      description: language === 'vi' ? 'CV của bạn thực sự ấn tượng' : 'Your CV is truly impressive',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-green-400 to-green-600'
    },
    {
      score: 100,
      title: language === 'vi' ? 'CV hoàn hảo!' : 'Perfect CV!',
      description: language === 'vi' ? 'Bạn đã tạo ra một CV hoàn hảo!' : 'You\'ve created a perfect CV!',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'from-purple-400 to-pink-500'
    }
  ];

  const progressPercentage = Math.min((appliedSuggestions / Math.max(totalSuggestions, 1)) * 100, 100);
  const improvement = currentScore - previousScore;

  // Animate score changes
  useEffect(() => {
    if (currentScore !== animatedScore) {
      setIsAnimating(true);
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = (currentScore - animatedScore) / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        setAnimatedScore(prev => {
          const newValue = prev + increment;
          return currentStep >= steps ? currentScore : newValue;
        });
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setIsAnimating(false);
          
          // Check for milestone achievement
          const newMilestone = milestones
            .filter(m => m.score <= currentScore && m.score > previousScore)
            .sort((a, b) => b.score - a.score)[0];
            
          if (newMilestone) {
            setAchievedMilestone(newMilestone);
            setShowMilestoneModal(true);
          }
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [currentScore, animatedScore, previousScore, milestones]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-green-600';
    if (score >= 75) return 'from-blue-500 to-blue-600';
    if (score >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {language === 'vi' ? 'Tiến độ tối ưu hóa' : 'Optimization Progress'}
            </h3>
            <p className="text-sm text-gray-600">
              {language === 'vi' ? 'Theo dõi cải thiện CV của bạn' : 'Track your CV improvements'}
            </p>
          </div>
        </div>
        
        {/* Score Display */}
        <div className="text-right">
          <div className={`text-3xl font-bold transition-all duration-500 ${getScoreTextColor(animatedScore)} ${isAnimating ? 'scale-110' : ''}`}>
            {Math.round(animatedScore)}%
          </div>
          {improvement > 0 && (
            <div className="flex items-center justify-end gap-1 text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              +{Math.round(improvement)}%
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {language === 'vi' ? 'Điểm CV' : 'CV Score'}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(animatedScore)}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getScoreColor(animatedScore)}`}
            style={{ width: `${Math.round(animatedScore)}%` }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>
        </div>
      </div>

      {/* Suggestions Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {language === 'vi' ? 'Gợi ý đã áp dụng' : 'Applied Suggestions'}
          </span>
          <span className="text-sm text-gray-500">
            {appliedSuggestions}/{totalSuggestions}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-purple-600"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Milestones */}
      <div className="grid grid-cols-4 gap-2">
        {milestones.map((milestone) => {
          const achieved = animatedScore >= milestone.score;
          return (
            <div
              key={milestone.score}
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
                achieved
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                achieved
                  ? `bg-gradient-to-br ${milestone.color} text-white shadow-lg`
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {milestone.icon}
              </div>
              <span className={`text-xs font-medium mt-1 ${
                achieved ? 'text-green-700' : 'text-gray-500'
              }`}>
                {milestone.score}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Celebration */}
      {showCelebration && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-blue-50 text-green-800 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">
            <span className="text-lg animate-bounce">🎉</span>
            {language === 'vi' ? 'Tuyệt vời! CV đã được cải thiện!' : 'Amazing! CV has been improved!'}
          </div>
        </div>
      )}

      {/* Milestone Achievement Modal */}
      {showMilestoneModal && achievedMilestone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 text-center relative overflow-hidden">
            {/* Confetti Background */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 opacity-50"></div>
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-br from-yellow-400 to-pink-500 rounded-full animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: '1.5s'
                  }}
                ></div>
              ))}
            </div>
            
            <div className="relative z-10">
              <div className={`w-16 h-16 bg-gradient-to-br ${achievedMilestone.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce`}>
                {achievedMilestone.icon}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {achievedMilestone.title}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {achievedMilestone.description}
              </p>
              
              <button
                onClick={() => {
                  setShowMilestoneModal(false);
                  onCelebrationComplete?.();
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {language === 'vi' ? 'Tiếp tục' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 