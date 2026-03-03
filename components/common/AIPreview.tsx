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
  useRealAI = false
}) => {
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

  return (
    <div className="border border-green-100 rounded-lg overflow-hidden">
      <div className="bg-green-50 p-4 flex items-start gap-3">
        <div className="bg-green-600 rounded-md p-2 mt-1">
          <SparklesIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-green-800">
            {isVietnamese ? 'AI sẽ tạo ra nội dung như thế này:' : 'AI will create content like this:'}
          </h3>
          <p className="text-sm text-green-700">
            {isVietnamese ? 'Dựa trên vị trí và công ty bạn nhập' : 'Based on the position and company you entered'}
          </p>
        </div>
      </div>
      <div className="p-5 bg-white">
        <div className="mb-3">
          <h3 className="text-lg font-medium">
            {jobTitle} {isVietnamese ? 'tại' : 'at'} {company}
          </h3>
        </div>
        <ul className="space-y-3">
          {bulletsToShow.map((bullet, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-1">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-3 flex items-center justify-center">
          <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
            <SparklesIcon className="h-4 w-4" />
            <span>{isVietnamese ? 'Được tạo bởi AI' : 'Generated by AI'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
