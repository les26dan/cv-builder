"use client";

import { useState, useEffect, useCallback } from "react";
import { account } from "../../config/texts/index";

interface MathCaptchaProps {
  onValidation: (isValid: boolean, sessionId?: string) => void;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

interface CaptchaProblem {
  num1: number;
  num2: number;
  operation: string;
}

export default function MathCaptcha({ onValidation, value, onChange, error }: MathCaptchaProps) {
  const [problem, setProblem] = useState<CaptchaProblem | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  const generateNewProblem = useCallback(async () => {
    setIsLoading(true);
    setApiError("");
    
    try {
      const response = await fetch("/api/captcha/");
      if (response.ok) {
        const data = await response.json();
        setProblem(data.problem);
        setSessionId(data.sessionId);
        onChange("");
        onValidation(false);
        console.log('✅ CAPTCHA loaded successfully');
      } else {
        const errorData = await response.json();
        console.error("Failed to generate CAPTCHA:", errorData);
        setApiError(account.captcha.errors.loadFailed);
      }
    } catch (error) {
      console.error("Error generating CAPTCHA:", error);
      setApiError(account.captcha.errors.networkError);
    } finally {
      setIsLoading(false);
    }
  }, [onChange, onValidation]);

  useEffect(() => {
    generateNewProblem();
  }, [generateNewProblem]);

  useEffect(() => {
    if (value && problem && sessionId) {
      // Validate on server when user provides an answer
      const validateAnswer = async () => {
        try {
          const response = await fetch("/api/captcha/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionId,
              answer: value,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            onValidation(data.valid, sessionId);
          } else {
            onValidation(false);
          }
        } catch (error) {
          console.error("Error validating CAPTCHA:", error);
          onValidation(false);
        }
      };

      validateAnswer();
    } else {
      onValidation(false);
    }
  }, [value, problem, sessionId, onValidation]);

  // Show error state if API failed
  if (apiError) {
    return (
      <div className="w-full max-w-xs mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-3">
          <div className="text-center">
            <p className="text-sm text-red-600 mb-2">{apiError}</p>
            <button
              type="button"
              onClick={generateNewProblem}
              disabled={isLoading}
              className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? account.captcha.loading : account.captcha.retryButton}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!problem || isLoading) {
    return (
      <div className="w-full max-w-xs mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mb-3">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
            <span className="text-sm text-gray-500">{account.captcha.loading}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* CAPTCHA Question */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mb-3">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <span className="text-lg sm:text-xl font-bold text-gray-700">{problem.num1}</span>
          <span className="text-lg sm:text-xl font-bold text-gray-700">{problem.operation}</span>
          <span className="text-lg sm:text-xl font-bold text-gray-700">{problem.num2}</span>
          <span className="text-lg sm:text-xl font-bold text-gray-700">=</span>
          <span className="text-lg sm:text-xl font-bold text-gray-700">?</span>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 h-9 sm:h-10 px-2 sm:px-3 bg-white border border-gray-300 rounded text-sm sm:text-base text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={account.captcha.placeholder}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={generateNewProblem}
            disabled={isLoading}
            className="flex items-center justify-center w-9 sm:w-10 h-9 sm:h-10 bg-gray-200 hover:bg-gray-300 rounded transition-colors disabled:opacity-50"
            title={account.captcha.refreshTooltip}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            ) : (
              <svg 
                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs sm:text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}