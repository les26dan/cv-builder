import React from 'react';
import { XIcon } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  featureName,
  featureDescription
}) => {
  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    // In production, this would redirect to payment/upgrade page
    console.log('Redirecting to upgrade page...');
    // Mock upgrade for testing
    window.open('/upgrade-to-premium', '_blank');
  };

  const handleMockUpgrade = () => {
    // For testing purposes - simulate premium upgrade
    localStorage.setItem('okbuddy_test_subscription', JSON.stringify({
      plan: 'premium',
      features: ['apply_all', 'advanced_suggestions', 'unlimited_analysis']
    }));
    alert('Mô phỏng nâng cấp thành công! Tải lại trang để xem thay đổi.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XIcon className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">⭐</span>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
            Nâng cấp lên Premium
          </h2>
          <p className="text-gray-600 text-center text-sm">
            Mở khóa tính năng cao cấp để tối ưu hóa CV hiệu quả hơn
          </p>
        </div>

        {/* Feature highlight */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-purple-900 mb-2">{featureName}</h3>
          <p className="text-purple-700 text-sm">{featureDescription}</p>
        </div>

        {/* Premium features list */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Tính năng Premium:</h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">✓</span>
              <span className="text-sm text-gray-700">Áp dụng tất cả gợi ý với 1 click</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">✓</span>
              <span className="text-sm text-gray-700">Gợi ý AI nâng cao</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">✓</span>
              <span className="text-sm text-gray-700">Phân tích JD không giới hạn</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">✓</span>
              <span className="text-sm text-gray-700">Hỗ trợ ưu tiên</span>
            </li>
          </ul>
        </div>

        {/* Pricing */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-900">199.000₫</div>
          <div className="text-sm text-gray-600">/tháng</div>
          <div className="text-xs text-green-600 font-semibold mt-1">Tiết kiệm 30% với gói năm</div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleUpgradeClick}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Nâng cấp ngay
          </button>
          
          {/* Debug button for testing - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleMockUpgrade}
              className="w-full bg-gray-200 text-gray-700 py-2 px-6 rounded-lg text-sm hover:bg-gray-300 transition-all"
            >
              Mô phỏng nâng cấp (Dev)
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full text-gray-600 py-2 px-6 rounded-lg text-sm hover:text-gray-800 transition-all"
          >
            Để sau
          </button>
        </div>

        {/* Trust signals */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Bảo mật SSL
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              Hủy bất cứ lúc nào
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}; 