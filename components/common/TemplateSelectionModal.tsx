import React from 'react';
import { XIcon, PlusIcon } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  content: string;
  example: string;
}

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  jobTitle?: string;
}

const BULLET_TEMPLATES: Template[] = [
  {
    id: 'achievement',
    title: 'Thành tựu với kết quả',
    content: 'Dẫn dắt [nhóm/dự án] để [đạt được mục tiêu], mang lại [tác động cụ thể].',
    example: 'Dẫn dắt nhóm 5 kỹ sư để triển khai hệ thống CRM mới, mang lại cải thiện hiệu suất 30%.'
  },
  {
    id: 'implementation',
    title: 'Triển khai dự án',
    content: 'Triển khai [dự án/sáng kiến] giúp [kết quả đạt được].',
    example: 'Triển khai quy trình tự động hóa báo cáo giúp giảm thời gian xử lý 50%.'
  },
  {
    id: 'improvement',
    title: 'Cải thiện quy trình',
    content: 'Cải thiện [quy trình/chỉ số] bằng [X%] thông qua [hành động cụ thể].',
    example: 'Cải thiện tỷ lệ chuyển đổi khách hàng bằng 25% thông qua tối ưu hóa quy trình bán hàng.'
  },
  {
    id: 'collaboration',
    title: 'Hợp tác nhóm',
    content: 'Hợp tác với [bộ phận/nhóm] để [đạt được mục tiêu], mang lại [kết quả tích cực].',
    example: 'Hợp tác với nhóm thiết kế và phát triển để ra mắt tính năng mới, tăng sự hài lòng của khách hàng 20%.'
  },
  {
    id: 'management',
    title: 'Quản lý và lãnh đạo',
    content: 'Quản lý [nhóm/tài nguyên] để [đạt được mục tiêu], đảm bảo [kết quả chất lượng].',
    example: 'Quản lý nhóm 8 nhân viên để hoàn thành dự án đúng hạn, đảm bảo chất lượng cao và ngân sách.'
  },
  {
    id: 'problem-solving',
    title: 'Giải quyết vấn đề',
    content: 'Giải quyết [vấn đề/thách thức] bằng cách [phương pháp], dẫn đến [kết quả tích cực].',
    example: 'Giải quyết vấn đề hiệu suất hệ thống bằng cách tối ưu hóa database, giảm thời gian phản hồi 60%.'
  }
];

export const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  jobTitle
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-testid="modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-label="Chọn mẫu gạch đầu dòng"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="text-primary-500">
              <PlusIcon size={24} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Chọn mẫu gạch đầu dòng
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Đóng"
          >
            <XIcon size={24} />
          </button>
        </div>

        {/* Description */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <p className="text-sm text-gray-600">
            Chọn một mẫu phù hợp với kinh nghiệm của bạn. Bạn có thể điền vào các phần [trong ngoặc] 
            với thông tin cụ thể của mình.
          </p>
          {jobTitle && (
            <p className="text-sm text-primary-600 mt-1">
              Gợi ý cho vị trí: <span className="font-medium">{jobTitle}</span>
            </p>
          )}
        </div>

        {/* Templates */}
        <div className="p-6 space-y-4">
          {BULLET_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900">{template.title}</h3>
                <button className="text-primary-500 hover:text-primary-600 flex items-center gap-1 text-sm">
                  <PlusIcon size={16} />
                  Chọn
                </button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  {template.content}
                </p>
                <div className="border-l-4 border-primary-200 pl-3">
                  <p className="text-xs text-gray-500 mb-1">Ví dụ:</p>
                  <p className="text-sm text-gray-700">{template.example}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 bg-primary-100 rounded flex items-center justify-center">
              <span className="text-primary-600 text-xs">💡</span>
            </div>
            <span>
              Hoặc bạn có thể bắt đầu với một mẫu trống và sử dụng AI để hoàn thiện.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}; 