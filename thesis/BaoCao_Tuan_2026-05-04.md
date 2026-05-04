# Báo cáo tuần — Khoá luận tốt nghiệp
**Tuần 27/04 – 04/05/2026**

## 1. Em muốn làm gì?

So sánh **3 cách chấm điểm độ phù hợp giữa CV và mô tả công việc (JD)** để biết cách nào tốt nhất:

- **TF-IDF**: đếm từ trùng lặp giữa CV và JD, từ càng hiếm càng nặng điểm. Nhanh, miễn phí.
- **Embeddings**: dùng OpenAI biến CV và JD thành vector ngữ nghĩa, so độ giống bằng cosine. Hiểu được nghĩa gần dù khác từ.
- **LLM (GPT-4o-mini)**: hỏi thẳng AI "CV này phù hợp JD này mấy điểm?". Thông minh nhất nhưng đắt nhất.

## 2. Tại sao cần làm?

Các công cụ tuyển dụng hiện nay (TopCV, LinkedIn) chủ yếu **lọc từ khoá** nên dễ bỏ sót CV viết khác cách — JD ghi "Frontend developer" nhưng CV ghi "UI engineer" sẽ bị trượt dù thực ra phù hợp. 3 hướng trên đều đã được dùng trong và ngoài nước, **nhưng chưa có công trình tiếng Việt nào so sánh trực tiếp** xem cách nào đáng tiền. Khoá luận trả lời 2 câu hỏi:

- **RQ1**: Cách nào **chính xác nhất**? (đo bằng Precision@10, nDCG@10)
- **RQ2**: Đắt hơn có **đáng tiền** không, hay TF-IDF rẻ là đủ?

## 3. Em sẽ làm thế nào?

**Bước 1 — Dữ liệu:** lấy dataset Kaggle (2.400 CV + JD), chia thành **400 cặp** (200 cặp khớp + 200 cặp lệch nhóm nghề). "Khớp" định nghĩa là CV và JD cùng 1 trong 24 nhóm nghề (Strategy A — category proxy).

**Bước 2 — Cài đặt 3 matcher** dưới dạng module độc lập trong `shared/services/matching/`. Đã xong TF-IDF và Embeddings, tuần tới làm wrapper LLM.

**Bước 3 — Chạy đánh giá** từng phương pháp trên cả 400 cặp, ghi lại điểm số, thời gian xử lý, chi phí API.

**Bước 4 — Phân tích thống kê:** tính Precision@10, nDCG@10, latency p50/p95, USD/1000 cặp; chạy paired Wilcoxon (α=0.05) để khẳng định khác biệt có ý nghĩa thống kê hay không; vẽ biểu đồ Pareto cost-vs-quality.

**Bước 5 — Viết Chương 5 Đánh giá** (~16 trang, đóng góp chính của khoá luận), sau đó Chương 2 cơ sở lý thuyết và Chương 6 kết luận.

## 4. Tuần qua đã làm

- Migration database (pgvector + bảng `cv_embedding`, `jd_targets`, `match_runs`)
- Code TF-IDF matcher (test: cặp khớp 64đ, cặp lệch 22đ → phân biệt tốt)
- Code Embeddings matcher (có cache sha256 tránh embed lại)
- Tải dataset Kaggle 2.400 CV + JD, xây bảng ánh xạ 24 nhóm nghề → JD title
- Fix bug: parser CSV cho JD có dấu `,`, sample JobPostings 517MB → 21MB

## 5. Tuần tới (05/05 – 11/05)

Hoàn thiện LLM matcher → chạy đánh giá 3 phương pháp trên 400 cặp → có bảng kết quả trước **10/05** để bắt đầu viết Chương 5. Tuần kế nữa dành 100% cho viết thesis.

## 6. Cần thầy/cô góp ý

1. Ground truth "cùng nhóm nghề = match" có ổn không, hay cần kết hợp thêm overlap kỹ năng?
2. 400 cặp đủ statistical power chưa?
3. Em cắt phần khảo sát người thật (do deadline 2 tuần) — có ảnh hưởng điểm bảo vệ không?
