'use client';

import { useState, useEffect } from 'react';
import { getTexts } from '../../config/texts/index';
import { detectLanguage, type SupportedLanguage } from '../../config/languageConfig';

export default function PrivacyContent() {
  const [privacyTexts, setPrivacyTexts] = useState<any>(null);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');

  useEffect(() => {
    const initLanguage = async () => {
      // Get language from localStorage or detect language
      const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage;
      let language: SupportedLanguage;
      
      if (savedLanguage && ['vi', 'en'].includes(savedLanguage)) {
        language = savedLanguage;
      } else {
        // Use language detection system
        const detectedLanguage = detectLanguage();
        language = detectedLanguage.language;
        localStorage.setItem('okbuddy_language', language);
      }
      
      setCurrentLanguage(language);
      
      // Load privacy texts for the detected language
      try {
        const texts = await getTexts('account', language);
        setPrivacyTexts(texts.privacy);
      } catch (error) {
        console.error('Failed to load privacy texts:', error);
        // Fallback to English
        const fallbackTexts = await getTexts('account', 'en');
        setPrivacyTexts(fallbackTexts.privacy);
      }
    };
    
    initLanguage();
  }, []);

  if (!privacyTexts) {
    return (
      <main className="flex-1 flex justify-center items-center px-4 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 lg:p-10">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {privacyTexts.title}
          </h1>
          <p className="text-gray-600 text-lg">
            {privacyTexts.lastUpdated || (currentLanguage === 'vi' ? 'Cập nhật lần cuối: 3/8/2025' : 'Last Updated: August 3, 2025')}
          </p>
        </header>

        <div className="prose prose-lg max-w-none">
          {privacyTexts.sections.map((section: any, index: number) => (
            <section key={index} className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {section.title}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {section.content}
              </p>
            </section>
          ))}

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {currentLanguage === 'vi' ? '9. Liên Hệ' : '9. Contact'}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {currentLanguage === 'vi' 
                ? 'Nếu bạn có bất kỳ câu hỏi nào về Chính sách Bảo mật này, vui lòng liên hệ với chúng tôi qua:'
                : 'If you have any questions about this Privacy Policy, please contact us via:'
              }
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">
                <strong>Email:</strong> admin@example.com<br/>
                <strong>Website:</strong> www.okbuddy.com
              </p>
            </div>
          </section>

        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            {currentLanguage === 'vi'
              ? 'Chính sách này có thể được cập nhật theo thời gian. Phiên bản mới nhất sẽ luôn có sẵn trên trang web này.'
              : 'This policy may be updated from time to time. The latest version will always be available on this website.'
            }
          </p>
        </div>
      </div>
    </main>
  );
}