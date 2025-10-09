# Trait Flow Prototype – Giới thiệu nhanh (Tiếng Việt)

Tài liệu này dùng để giải thích đơn giản mục tiêu và trải nghiệm của bản prototype cho những người không trực tiếp tham gia phát triển cũng như người dùng thử nghiệm.

---

## 1. Nói ngắn gọn thì đây là gì?
- **Trait Flow** là “huấn luyện viên cá nhân” gửi gợi ý nhỏ mỗi ngày, dựa trên **tâm trạng hôm nay** và **kiểu tính cách** của bạn.
- Prototype kết hợp “bài trắc nghiệm 10 câu TIPI” và “check-in hằng ngày”, hướng đến việc **tạo thói quen 3 phút mỗi ngày để gia tăng nhận thức**.

---

## 2. Một ngày trải nghiệm mẫu
```
⓪ Lần đầu (sau khi đăng ký): trả lời 10 câu TIPI → xem kết quả & hướng dẫn sử dụng
① Buổi sáng: mở ứng dụng và đọc lại thông điệp của ngày hôm trước
② Buổi trưa: ghi nhanh cảm xúc & mức năng lượng (có thể thêm ghi chú)
③ Ngay lập tức: nhận gợi ý dựa trên kiểu tính cách và trạng thái gần đây
④ Buổi tối: đánh giá gợi ý hữu ích đến mức nào (1–5 sao)
⑤ Cuối tuần: xem lại biểu đồ cảm xúc và ghi chú trong trang lịch sử
```

---

## 3. Giá trị mang lại
- **Nhìn lại khách quan thói quen của bản thân**: kết hợp kết quả TIPI với nhật ký cảm xúc để nhận ra các khuynh hướng.
- **Biết rõ “bước tiếp theo nên làm gì”**: tâm trạng cao → đề xuất hành động, tâm trạng thấp → chăm sóc bản thân, mức trung bình → câu hỏi gợi mở.
- **Phản hồi được tiếp thu ngay**: ghi nhận gợi ý hữu ích hay chưa để cải thiện những lần gửi tiếp theo.

---

## 4. Các màn hình người dùng thấy
| Màn hình | Mục đích | Mô tả ngắn |
|----------|----------|------------|
| Onboarding | Hiểu kiểu tính cách | Trả lời 10 câu để xem biểu đồ 5 đặc tính chính (chỉ xuất hiện lần đầu) |
| Trang chủ | Cập nhật trạng thái trong ngày | Xem thông điệp gần nhất và nút check-in “Hôm nay thế nào?” |
| Cửa sổ Check-in | Nhập cảm xúc | Thanh trượt cảm xúc + nút năng lượng + ô ghi chú |
| Thông điệp can thiệp | Nhận gợi ý ngay | OpenAI định dạng tiêu đề + nội dung + CTA |
| Lịch sử | Tự xem lại | Danh sách check-in và thông điệp theo thời gian |

---

## 5. Hậu trường hoạt động ra sao?
```mermaid
flowchart LR
  subgraph Onboarding lần đầu
    User -->|Trả lời TIPI| EdgeFnTipi[Edge Function (tipi-submit)]
    EdgeFnTipi -->|Lưu điểm| DB[(PostgreSQL)]
    DB -->|Trả kết quả| AppUITipi[Màn hình kết quả TIPI]
  end
  subgraph Quy trình hằng ngày
    User -->|Check-in| EdgeFn[Edge Function (checkins)]
    EdgeFn -->|Mood + TIPI + trung bình gần đây| Prompt[Tạo prompt]
    Prompt -->|Structured Output| OpenAI[OpenAI Responses]
    OpenAI --> EdgeFn --> DB
    DB --> AppUI[Giao diện ứng dụng]
  end
```
- Backend xây dựng bằng Supabase (PostgreSQL + Edge Functions).
- OpenAI Responses API tạo thông điệp dựa trên template.
- Quyền truy cập được kiểm soát để chỉ chính người dùng nhìn thấy dữ liệu của mình.

---

## 6. Lộ trình 8 tuần (phiên bản rút gọn)
| Tuần | Công việc chính | Kết quả |
|------|-----------------|---------|
| Week 1 | Dựng môi trường, phác UI TIPI | Bản demo giao diện đầu tiên |
| Week 2 | Hoàn thiện TIPI & trang kết quả | Xong Onboarding |
| Week 3 | Check-in + tạo thông điệp can thiệp | Nhận được gợi ý ngay sau check-in |
| Week 4 | Trang lịch sử, đánh giá, số liệu cơ bản | Hoàn thiện vòng trải nghiệm |
| Weeks 5-6 | Kiểm thử nội bộ, cải thiện | Danh sách bug & cải tiến |
| Weeks 7-8 | Chạy pilot | Thu thập phản hồi người dùng |

---

## 7. FAQ – Câu hỏi thường gặp
- **Hỏi: Vì sao chọn TIPI?**  
  Đáp: TIPI chỉ 10 câu nhưng cho thấy xu hướng Big Five, giúp hạ thấp rào cản ở lần dùng đầu. Sau này có thể mở rộng sang IPIP-NEO, v.v.

- **Hỏi: Mỗi thông điệp có phải do AI viết mới?**  
  Đáp: Có 3 template (hành động / phản tư / tự cảm thông). OpenAI điều chỉnh lời văn theo trạng thái người dùng; nếu lỗi sẽ dùng câu mẫu dự phòng.

- **Hỏi: Dữ liệu có an toàn không?**  
  Đáp: Supabase Row Level Security đảm bảo chỉ chủ nhân mới xem được dữ liệu. Thông tin gửi đến OpenAI cũng ở mức tối thiểu.

- **Hỏi: Kế hoạch phát triển tiếp theo?**  
  Đáp: Sẽ bổ sung phân tích văn bản bằng Symanto API và nâng cấp thuật toán gợi ý (ví dụ bandit) trong các giai đoạn sau.

---

## 8. Từ điển mini
| Thuật ngữ | Ý nghĩa |
|-----------|---------|
| TIPI | Ten Item Personality Inventory – Bài trắc nghiệm 10 câu về Big Five. |
| Check-in | Ghi lại cảm xúc, năng lượng và ghi chú ngắn trong ngày. |
| Thông điệp can thiệp | Gợi ý do AI tạo, gồm tiêu đề, nội dung và CTA. |
| CTA | Call To Action – Hành động cụ thể được khuyến nghị tiếp theo. |

---

## 9. Dành cho những ai?
- Người dùng dự kiến tham gia đợt pilot.
- Các bên liên quan (kinh doanh, lãnh đạo) cần hiểu nhanh về prototype.
- Ứng viên tiềm năng muốn tham gia phát triển sản phẩm.

---

## 10. Liên hệ & bước tiếp theo
- Nếu muốn tham gia pilot, vui lòng liên hệ Product Owner (naruse).  
- Ý tưởng cải tiến chức năng: tạo issue trên GitHub hoặc gửi vào Slack #trait-flow.
