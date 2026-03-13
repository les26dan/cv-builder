import React, { useEffect, useState } from 'react';
import { SparklesIcon } from 'lucide-react';
import { aiService, WizardBulletGenerationRequest } from '../../utils/aiService';

interface AIPreviewProps {
  jobTitle: string;
  company: string;
  project?: string;
  impact?: string;
  isLoading: boolean;
  showPreview: boolean;
  isEnhanced: boolean;
  language?: 'en' | 'vi';
  useRealAI?: boolean; // Whether to use real AI service or mock data
  previewTitle?: string;
  previewSubtitle?: string;
  // Dynamic content props for future implementation
  dynamicProject?: string; // Will be populated based on job title keywords
  dynamicImpact?: string; // Will be populated based on job title keywords
}

export const AIPreview: React.FC<AIPreviewProps> = ({
  jobTitle,
  company,
  project,
  impact,
  isLoading,
  showPreview,
  isEnhanced,
  language = 'vi',
  useRealAI = false,
  previewTitle,
  previewSubtitle,
  dynamicProject,
  dynamicImpact
}) => {
  console.log('🚀 AI PREVIEW DEBUG: Render started - showPreview:', showPreview, 'isLoading:', isLoading, 'at', performance.now());
  const [realBullets, setRealBullets] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Generate real AI content when useRealAI is enabled
  useEffect(() => {
    if (useRealAI && jobTitle && company && showPreview && !isLoading) {
      const generateRealContent = async () => {
        setAiLoading(true);
        try {
          const request: WizardBulletGenerationRequest = {
            jobTitle,
            company,
            project: project || '',
            impact: impact || '',
            responsibility: ''
          };
          
          const result = await aiService.generateBulletFromWizard(request);
          
          if (result.success && result.data) {
            // Split the generated content into bullet points
            const bullets = result.data.split('\n')
              .filter(line => line.trim())
              .map(line => line.replace(/^[-•*]\s*/, '').trim())
              .filter(line => line.length > 0)
              .slice(0, 3); // Limit to 3 bullets for preview
            
            setRealBullets(bullets);
          }
        } catch (error) {
          console.error('Error generating real AI content:', error);
          // Fallback to mock data on error
          setRealBullets([]);
        } finally {
          setAiLoading(false);
        }
      };

      generateRealContent();
    }
  }, [useRealAI, jobTitle, company, project, impact, showPreview, isLoading]);
  // Generate example bullets based on input
  const generateBullets = () => {
    const isVietnamese = language === 'vi';
    
    if (jobTitle.toLowerCase().includes('software') || jobTitle.toLowerCase().includes('developer')) {
      if (isEnhanced && project) {
        return isVietnamese ? [
          `Phát triển và tối ưu hóa ${project} sử dụng công nghệ tiên tiến, nâng cao hiệu suất hệ thống.`,
          `${impact || 'Cải thiện hiệu suất hệ thống 40%'} thông qua việc áp dụng các phương pháp lập trình hiện đại.`,
          `Hợp tác với các đội ngũ sản phẩm và thiết kế để đảm bảo trải nghiệm người dùng tối ưu.`
        ] : [
          `Develop and optimize ${project} using advanced technologies, improving system performance.`,
          `${impact || 'Improved system performance by 40%'} through implementing modern programming methodologies.`,
          `Collaborate with product and design teams to ensure optimal user experience.`
        ];
      }
      return isVietnamese ? [
        `Phát triển và bảo trì các ứng dụng phần mềm cho ${company}.`,
        `Cộng tác với đội ngũ phát triển để thiết kế và triển khai các giải pháp phần mềm.`,
        `Tham gia vào quá trình kiểm thử và đảm bảo chất lượng phần mềm.`
      ] : [
        `Develop and maintain software applications for ${company}.`,
        `Collaborate with development team to design and implement software solutions.`,
        `Participate in testing processes and ensure software quality.`
      ];
    }
    
    if (jobTitle.toLowerCase().includes('marketing')) {
      if (isEnhanced && project) {
        return isVietnamese ? [
          `Xây dựng và thực hiện ${project} để tăng nhận diện thương hiệu và thu hút khách hàng tiềm năng.`,
          `${impact || 'Tăng lượng truy cập website 25%'} thông qua các chiến dịch tiếp thị số tích hợp.`,
          `Phân tích dữ liệu từ các chiến dịch để tối ưu hóa ROI và hiệu quả tiếp thị.`
        ] : [
          `Build and implement ${project} to increase brand awareness and attract potential customers.`,
          `${impact || 'Increased website traffic by 25%'} through integrated digital marketing campaigns.`,
          `Analyze campaign data to optimize ROI and marketing effectiveness.`
        ];
      }
      return isVietnamese ? [
        `Phát triển và thực hiện các chiến lược tiếp thị để thúc đẩy sản phẩm và dịch vụ của ${company}.`,
        `Quản lý các chiến dịch tiếp thị trên nhiều kênh để tối đa hóa khả năng tiếp cận.`,
        `Phân tích hiệu suất chiến dịch và đề xuất cải tiến dựa trên dữ liệu.`
      ] : [
        `Develop and implement marketing strategies to promote ${company}'s products and services.`,
        `Manage marketing campaigns across multiple channels to maximize reach.`,
        `Analyze campaign performance and propose data-driven improvements.`
      ];
    }
    
    // Default bullets
    if (isEnhanced && project) {
      return isVietnamese ? [
        `Chịu trách nhiệm chính về ${project} tại ${company}, đảm bảo đạt được các mục tiêu kinh doanh.`,
        `${impact || 'Cải thiện hiệu quả hoạt động 30%'} thông qua việc tối ưu hóa quy trình và đổi mới.`,
        `Lãnh đạo và phối hợp với các bộ phận khác để thực hiện các sáng kiến chiến lược.`
      ] : [
        `Take primary responsibility for ${project} at ${company}, ensuring business objectives are met.`,
        `${impact || 'Improved operational efficiency by 30%'} through process optimization and innovation.`,
        `Lead and coordinate with other departments to implement strategic initiatives.`
      ];
    }
    
    return isVietnamese ? [
      `Đảm nhận vai trò ${jobTitle} tại ${company}, phụ trách các hoạt động chính và dự án quan trọng.`,
      `Phối hợp với các bộ phận liên quan để đảm bảo hiệu quả công việc và đạt mục tiêu đề ra.`,
      `Đóng góp vào việc phát triển và cải tiến quy trình làm việc của tổ chức.`
    ] : [
      `Serve as ${jobTitle} at ${company}, responsible for key activities and important projects.`,
      `Coordinate with related departments to ensure work efficiency and achieve set objectives.`,
      `Contribute to the development and improvement of organizational work processes.`
    ];
  };

  if (!showPreview) return null;
  if (isLoading || aiLoading) return null;

  const isVietnamese = language === 'vi';
  
  // Use real AI bullets if available, otherwise fallback to mock data
  const bulletsToShow = useRealAI && realBullets.length > 0 ? realBullets : generateBullets();

  console.log('🚀 AI PREVIEW DEBUG: About to render JSX - showPreview:', showPreview, 'at', performance.now());

  if (!showPreview) {
    console.log('🚀 AI PREVIEW DEBUG: Not showing preview - returning null');
    return null;
  }

  console.log('🚀 AI PREVIEW DEBUG: Rendering full AIPreview component at', performance.now());

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#eff6ff' }}>
      {/* Title section */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-green-600" />
          <h3 className="font-bold text-gray-800 text-base">
            {previewTitle || (isVietnamese ? 'AI sẽ tạo ra nội dung như thế này:' : 'AI will create content like this:')}
          </h3>
        </div>
        {previewSubtitle && (
          <p className="text-sm text-gray-700 mt-1">
            {previewSubtitle}
          </p>
        )}
      </div>

      {/* Content section with white background */}
      <div className="bg-white mx-3 mb-3 rounded-lg p-3">
        {/* Two column layout */}
        <div className="flex gap-4">
          {/* Column 1: You give */}
          <div className="flex-1">
            <h3 className="text-sm font-medium mb-1">
              {isVietnamese ? 'Bạn viết ngắn gọn:' : 'You give:'}
            </h3>
            <div className="text-gray-600 text-xs space-y-1 mt-4">
              <p><span style={{ color: '#6B7280' }}>Main project:</span> <span className="px-1.5 py-0.5 rounded text-xs text-white" style={{ backgroundColor: '#3B82F6' }}>{dynamicProject || (isVietnamese ? 'Launch sản phẩm mới' : 'Product launches')}</span></p>
              <p><span style={{ color: '#6B7280' }}>Key result:</span> <span className="px-1.5 py-0.5 rounded text-xs text-white" style={{ backgroundColor: '#10B981' }}>{dynamicImpact || (isVietnamese ? '40% người dùng mới' : '40% growth')}</span></p>
            </div>
          </div>
          
          {/* Arrow connecting the columns */}
          <div className="flex items-center justify-center">
            <div className="text-green-600 text-lg">→</div>
          </div>
          
          {/* Column 2: OkBuddy writes */}
          <div className="flex-1">
            <h3 className="text-sm font-medium mb-1">
              {isVietnamese ? 'OkBuddy cải thiện thành:' : 'OkBuddy writes:'}
            </h3>
            <div className="border-2 border-green-200 rounded-lg p-2 bg-green-50">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5 text-sm">•</span>
                <span className="text-gray-800 text-xs leading-relaxed">{isVietnamese 
                  ? 'Dẫn dắt chiến lược go-to-market cho 3 đợt ra mắt sản phẩm lớn, thúc đẩy tăng trưởng 40% thu hút người dùng mới'
                  : 'Spearheaded go-to-market strategy for 3 major product launches, driving 40% user acquisition growth'
                }</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
