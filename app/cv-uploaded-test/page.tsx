'use client';

import Link from 'next/link';

export default function CVTestSitesIndex() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            CV Upload Test Sites
          </h1>
          <p className="text-gray-600">
            Pre-loaded CV test data for rapid testing without ChatGPT API calls
          </p>
        </div>

        <div className="grid gap-4">
          <Link 
            href="/cv-uploaded-test/manroe"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">Manroe Tran</h3>
            <p className="text-sm text-gray-600">Product Manager at MoMo (Original test CV)</p>
          </Link>

          
          <Link 
            href="/cv-uploaded-test/ho-nguyen-hai-nam"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">Ho Nguyen Hai Nam</h3>
            <p className="text-sm text-gray-600">CV: Resume_HoNguyenHaiNam.pdf</p>
          </Link>
          <Link 
            href="/cv-uploaded-test/nguyen-tuan-anh"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">Nguyen Tuan Anh</h3>
            <p className="text-sm text-gray-600">CV: Nguyen Tuan Anh's CV (1).pdf</p>
          </Link>
          <Link 
            href="/cv-uploaded-test/marie-quyen-guilhem"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">Marie Quyen Guilhem</h3>
            <p className="text-sm text-gray-600">CV: Marie Quyen Guilhem CV (1).pdf</p>
          </Link>
          <Link 
            href="/cv-uploaded-test/tu-bryan"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">Tu Bryan</h3>
            <p className="text-sm text-gray-600">CV: Tu_Bryan_CV_TechPM (1).pdf</p>
          </Link>
          <Link 
            href="/cv-uploaded-test/kien-vu"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">Kien Vu</h3>
            <p className="text-sm text-gray-600">CV: Kien Vu Sr. Product Manager (Jan 2025).pdf</p>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/cv-upload"
            className="inline-block py-2 px-6 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Back to CV Upload
          </Link>
        </div>
      </div>
    </div>
  );
}