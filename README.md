# CV Builder

Ứng dụng web giúp tạo CV chuyên nghiệp, kèm công cụ **so khớp CV với mô tả công việc (JD)** sử dụng 3 phương pháp: TF-IDF (từ khoá), Embedding (ngữ nghĩa), và LLM (suy luận).

Dự án được xây dựng bằng **Next.js 15 (App Router)** + **TypeScript** + **Tailwind CSS** + **Supabase**.

---

## Tính năng chính

### 1. Trình soạn thảo CV
- Soạn CV theo từng phần: Thông tin liên hệ, Tóm tắt, Kinh nghiệm, Kỹ năng, Học vấn.
- Thêm/bớt linh hoạt các phần mở rộng: **Dự án**, **Hoạt động tình nguyện**, **Chứng chỉ**, **Sở thích**, hoặc phần tuỳ chỉnh.
- Hỗ trợ **ghi chú dạng Markdown** cho từng mục (in đậm, in nghiêng, danh sách, link).
- Tự động lưu vào Supabase (đã đăng nhập) hoặc `localStorage` (dùng thử).
- Xuất CV ra **DOCX** giữ nguyên định dạng.

### 2. CV Workspace — soạn thảo + phân tích JD
Truy cập tại `/cv-workspace` — không gian làm việc tích hợp:
- Soạn thảo CV và **nháp mô tả công việc (JD)** trong cùng một màn hình.
- **Phân tích JD tự động** bằng AI: trích xuất kỹ năng yêu cầu, highlight điểm khớp/thiếu với CV.
- Mỗi CV có JD draft và kết quả phân tích riêng biệt.

### 3. So khớp CV ↔ JD (3 phương pháp)
Truy cập tại `/cv-match/[cvId]` — tự động lấy CV bạn vừa soạn từ trình soạn thảo.

| Phương pháp | Cách hoạt động | Tốc độ | Chi phí | Khi nào dùng |
|---|---|---|---|---|
| **TF-IDF** | Đếm tần suất từ khoá (lexical) | ~1ms | $0 | JD và CV dùng đúng từ khoá giống nhau |
| **Embedding** | Vector hoá ngữ nghĩa (Voyage AI) | ~200ms | rất thấp | Hai bên dùng từ khác nhau nhưng cùng ý |
| **LLM** | Suy luận bằng Claude/GPT | ~2-3s | cao hơn | Cần giải thích chi tiết khớp/không khớp |

Mỗi phương pháp hiển thị **panel riêng** với điểm số, từ khoá khớp, và biểu đồ so sánh trade-off chi phí ↔ chất lượng.

### 4. Gợi ý việc làm
Truy cập tại `/jobs/[cvId]` — tìm việc làm phù hợp dựa trên CV:
- Tìm kiếm job postings từ database qua `/api/jobs/search`.
- Hiển thị điểm khớp và lý do phù hợp cho từng vị trí.

### 5. RAG Pipeline (thực nghiệm)
Pipeline kết hợp retrieval + generation để cải thiện chất lượng so khớp:
- Embedding corpus job postings vào vector store.
- Retrieve top-K candidates trước khi gọi LLM rerank.

### 6. Pipeline đánh giá (cho khoá luận)
Bộ script tính các chỉ số chuẩn xếp hạng: **nDCG@10, MAP, MRR, P@K, ROC/AUC** trên ground truth tự dán nhãn.

```bash
npm run eval:build-truth        # dán nhãn ground truth từ tập CV-JD
npm run eval:embed              # cache embedding cho corpus
npm run eval:run                # chạy đánh giá 3 phương pháp
python scripts/evaluate-rag.py  # đánh giá RAG pipeline
python scripts/analyze-results.py   # vẽ biểu đồ + báo cáo
```

---

## Bắt đầu

### Yêu cầu
- Node.js ≥ 18
- npm ≥ 9
- (Tuỳ chọn) Python ≥ 3.10 cho script phân tích kết quả

### Cài đặt

```bash
git clone https://github.com/les26dan/cv-builder.git
cd cv-builder
npm install
cp .env.example .env.local   # rồi điền API key vào
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.

### Biến môi trường cần thiết

```bash
# Voyage AI — cho embedding matcher
VOYAGE_API_KEY=...

# Anthropic — cho LLM matcher (Claude)
ANTHROPIC_API_KEY=...

# OpenAI — cho CV parser và LLM matcher fallback
OPENAI_API_KEY=...

# Supabase — lưu CV, job postings của user đã đăng nhập
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Xem file `.env.example` để biết danh sách đầy đủ.

---

## Cấu trúc thư mục

```
app/
  page.tsx                  # Trang chủ
  cv-builder/[cvId]/        # Trình soạn thảo CV
  cv-workspace/             # Workspace tích hợp soạn CV + phân tích JD
  cv-match/[cvId]/          # Trang so khớp 3 phương pháp
  jobs/[cvId]/              # Gợi ý việc làm theo CV
  api/
    cv/match/               # API gọi 3 matcher song song
    cv/embed/               # API tạo embedding
    jobs/search/            # API tìm kiếm job postings
components/
  CVEditor.tsx              # State chính của editor
  EditorPanel.tsx           # UI từng phần CV
  JobCard.tsx               # Card hiển thị job posting
  match/                    # Các panel TF-IDF / Embedding / LLM
lib/
  ragPipeline.ts            # RAG pipeline (retrieval + rerank)
shared/services/matching/
  tfidfMatcher.ts           # Cài đặt TF-IDF
  embeddingMatcher.ts       # Voyage embedding + cosine
  llmMatcher.ts             # Prompt + parse Claude/GPT
scripts/                    # Script đánh giá thực nghiệm
  evaluate-rag.py           # Đánh giá RAG pipeline
  evaluate-rag-full.py      # Đánh giá đầy đủ toàn bộ corpus
  embed-large.py            # Tạo embedding cho corpus lớn
data/eval/                  # Ground truth + cache embedding + kết quả
thesis/                     # Báo cáo khoá luận (LaTeX)
```

---

## Lệnh thường dùng

```bash
npm run dev          # chạy dev server
npm run build        # build production
npm run lint         # kiểm tra ESLint
npm run smoke:embed  # smoke test cho embedding API
npm run smoke:llm    # smoke test cho LLM matcher
```
