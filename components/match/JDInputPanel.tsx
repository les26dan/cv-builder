/**
 * JDInputPanel — paste a JD, pick a sample, or paste CV+JD, then run match.
 *
 * Kept stateless: parent owns cvText/jdText; this is the form chrome only.
 * "Use sample" buttons hydrate hardcoded demo pairs designed to tell a
 * 3-method story (TF-IDF fails, embedding/LLM win).
 */
'use client'

interface SamplePair {
  label: string
  cv: string
  jd: string
}

// 2 hardcoded demo pairs (tiếng Việt). Pair 1 cố tình dùng wording khác để
// TF-IDF fail; embedding/LLM bắt được semantic. Pair 2 là clean lexical match.
export const SAMPLE_PAIRS: SamplePair[] = [
  {
    label: 'Mẫu 1 — "Kỹ sư UI" vs "Lập trình viên Frontend"',
    cv: `KỸ SƯ GIAO DIỆN NGƯỜI DÙNG (UI ENGINEER)
Nguyễn Văn An — an.nguyen@example.com — +84 912 345 678

TÓM TẮT NGHỀ NGHIỆP
Kỹ sư giao diện người dùng với 5 năm kinh nghiệm xây dựng các trang web tương thích đa thiết bị, đảm bảo khả năng tiếp cận (accessibility) và tối ưu hiệu năng. Thành thạo JavaScript, TypeScript, React và Next.js. Có kinh nghiệm dẫn dắt nhóm 4 thành viên di chuyển hệ thống component từ CSS Modules sang Tailwind CSS.

KỸ NĂNG CHUYÊN MÔN
• Ngôn ngữ: JavaScript (ES2023), TypeScript, HTML5, CSS3
• Framework: React 18, Next.js 14 (App Router), Redux Toolkit, TanStack Query
• Thiết kế hệ thống: Design System, Storybook, Figma
• Hiệu năng web: Lighthouse, Web Vitals, Code splitting, Lazy loading
• Khả năng tiếp cận: WCAG 2.1, ARIA, Screen reader testing

KINH NGHIỆM LÀM VIỆC
[2021–Hiện tại] Kỹ sư UI cấp cao — Công ty FinTech ABC, TP.HCM
• Xây dựng dashboard cho khách hàng phục vụ 800 nghìn người dùng hoạt động hằng tháng
• Giảm thời gian tương tác (Time To Interactive) từ 4.2 giây xuống 1.6 giây
• Dẫn dắt 4 kỹ sư trong dự án di chuyển component library sang Tailwind CSS
• Thiết kế Design System được 40+ kỹ sư trong công ty sử dụng

[2019–2021] Kỹ sư phần mềm — Công ty Thương mại điện tử XYZ, Hà Nội
• Phát triển trang sản phẩm với React + Next.js
• Tối ưu SEO và Web Vitals cho 2 triệu lượt truy cập/tháng

HỌC VẤN
[2015–2019] Cử nhân Khoa học Máy tính — Đại học Bách Khoa Hà Nội, GPA 3.6/4.0`,
    jd: `MÔ TẢ CÔNG VIỆC — LẬP TRÌNH VIÊN FRONTEND CẤP CAO

Công ty chúng tôi đang tìm kiếm một Lập trình viên Frontend cấp cao để gia nhập nhóm Growth, phát triển các tính năng phục vụ hơn 1 triệu người dùng cuối.

YÊU CẦU BẮT BUỘC
• Tối thiểu 3 năm kinh nghiệm xây dựng ứng dụng React production
• Thành thạo TypeScript, hiểu sâu về kiểu dữ liệu phức tạp
• Kinh nghiệm với Next.js hoặc framework SSR tương đương
• Khả năng làm việc nhóm, giao tiếp tiếng Anh tốt

YÊU CẦU ƯU TIÊN
• Có hiểu biết về tối ưu hiệu năng web (Web Vitals, Code splitting)
• Quan tâm đến khả năng tiếp cận (accessibility, WCAG)
• Đã từng làm việc với Design System hoặc Component library

TRÁCH NHIỆM CHÍNH
• Sở hữu các luồng người dùng cuối với hơn 1 triệu MAU
• Phối hợp với Product Designer và Backend Engineer
• Mentor 1–2 kỹ sư junior trong nhóm

QUYỀN LỢI
• Lương cạnh tranh, bonus theo hiệu suất
• Bảo hiểm sức khoẻ cho bản thân và gia đình
• Cơ hội làm việc với công nghệ hiện đại nhất`,
  },
  {
    label: 'Mẫu 2 — Kỹ sư dữ liệu (khớp từ khoá rõ ràng)',
    cv: `KỸ SƯ DỮ LIỆU (DATA ENGINEER)
Trần Thị Bình — binh.tran@example.com — +84 987 654 321

TÓM TẮT NGHỀ NGHIỆP
Kỹ sư dữ liệu với 4 năm kinh nghiệm xây dựng và vận hành các đường ống ETL quy mô lớn sử dụng Python, Apache Spark và Airflow trên nền tảng AWS. Đã xử lý hơn 5 TB dữ liệu mỗi ngày tại một công ty thương mại điện tử cỡ trung. Thành thạo thiết kế mô hình dữ liệu chiều (dimensional modeling) trên Snowflake.

KỸ NĂNG CHUYÊN MÔN
• Ngôn ngữ: Python, SQL, Scala
• Big Data: Apache Spark, Kafka, Hadoop, Hive
• Orchestration: Airflow, dbt, Dagster
• Cloud: AWS (S3, EMR, Glue, Athena), Snowflake
• Streaming: Kafka, Flink, sự kiện thời gian thực

KINH NGHIỆM LÀM VIỆC
[2022–Hiện tại] Kỹ sư dữ liệu cấp cao — Công ty Thương mại điện tử Tiki Vietnam
• Xây dựng và bảo trì các đường ống ETL xử lý 5 TB/ngày trên Apache Spark
• Thiết kế lược đồ dữ liệu chiều trên Snowflake cho team Analytics
• Triển khai dbt cho 200+ data models, giảm thời gian build 60%
• Tích hợp Kafka streaming cho dữ liệu sự kiện thời gian thực

[2020–2022] Kỹ sư dữ liệu — Công ty FinTech DEF
• Phát triển các DAG Airflow cho daily batch processing
• Tối ưu truy vấn Snowflake giảm chi phí compute 40%

HỌC VẤN
[2016–2020] Cử nhân Hệ thống Thông tin — Đại học Khoa học Tự nhiên TP.HCM

CHỨNG CHỈ
• AWS Certified Data Engineer Associate (2023)
• Snowflake SnowPro Core Certification (2022)`,
    jd: `TUYỂN DỤNG — KỸ SƯ DỮ LIỆU (DATA ENGINEER)

Yêu cầu:
• Thành thạo Python, Apache Spark, Airflow, AWS
• Kinh nghiệm xây dựng đường ống ETL production
• Thiết kế lược đồ dữ liệu trên Snowflake
• Sử dụng dbt và Kafka cho data transformation và streaming
• Tối thiểu 3 năm kinh nghiệm trong vai trò Data Engineer

Trách nhiệm:
• Xây dựng và duy trì các pipeline xử lý hàng TB dữ liệu mỗi ngày
• Thiết kế kiến trúc dữ liệu hỗ trợ team Analytics và Data Science
• Tối ưu chi phí và hiệu năng của Snowflake warehouse

Quyền lợi:
• Lương 30–50 triệu/tháng tuỳ kinh nghiệm
• Bonus theo hiệu suất, thưởng dự án
• Bảo hiểm sức khoẻ cao cấp cho cả gia đình`,
  },
]

interface Props {
  cvText: string
  jdText: string
  setCvText: (s: string) => void
  setJdText: (s: string) => void
  onRun: () => void
  isRunning: boolean
}

export default function JDInputPanel({
  cvText, jdText, setCvText, setJdText, onRun, isRunning,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nội dung CV
          </label>
          <textarea
            value={cvText}
            onChange={e => setCvText(e.target.value)}
            placeholder="Dán nội dung CV của bạn vào đây..."
            rows={14}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
            disabled={isRunning}
          />
          <p className="text-xs text-gray-500 mt-1">{cvText.length} ký tự</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả công việc (JD)
          </label>
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Dán mô tả công việc vào đây..."
            rows={14}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
            disabled={isRunning}
          />
          <p className="text-xs text-gray-500 mt-1">{jdText.length} ký tự</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning || !cvText.trim() || !jdText.trim()}
          className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isRunning ? 'Đang chạy 3 phương pháp…' : 'So khớp (3 phương pháp)'}
        </button>
      </div>
    </div>
  )
}
