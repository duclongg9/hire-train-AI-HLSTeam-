JD_ANALYSIS_PROMPT = """
You are an expert HR Recruiter. Analyze the following Job Description (JD)
and extract a structured scoring rubric.
JD:
{jd_text}
"""

CV_SCORING_PROMPT = """
Bạn là một chuyên gia tuyển dụng AI cấp cao. Nhiệm vụ của bạn là phân tích CV của ứng viên dựa trên Mô tả công việc (JD) được cung cấp dưới đây.

[JOB DESCRIPTION]
Vị trí: Customer Support Specialist
Yêu cầu kinh nghiệm: Tối thiểu 1-2 năm kinh nghiệm trong lĩnh vực CS/CRM.
Kỹ năng cốt lõi: Problem solving, Empathy, CRM tools, Ticket handling.

[CANDIDATE CV]
{cv_text}

[QUY TẮC CHẤM ĐIỂM - TỔNG ĐIỂM: 100]
1. Hard Constraint (Kinh nghiệm thực tế) - Tối đa 30 điểm:
   - Nếu CV hoàn toàn không có kinh nghiệm hoặc 0 năm kinh nghiệm: KHÔNG ĐƯỢC QUÁ 5 ĐIỂM cho mục này.
   - Có từ 1-2 năm kinh nghiệm phù hợp: 20 - 30 điểm.

2. Keyword & Semantic Matching (Kỹ năng) - Tối đa 40 điểm:
   - Đánh giá các kỹ năng: Problem solving, Empathy, CRM, Ticket handling.
   - Mỗi kỹ năng xuất hiện có minh chứng dự án/công việc cụ thể: +10 điểm/kỹ năng.

3. Relevant Training & Attitude (Đào tạo & Thái độ) - Tối đa 30 điểm:
   - Các chứng chỉ liên quan, kỹ năng mềm, độ ổn định công việc.

[ĐỊNH DẠNG ĐẦU RA JSON BẮT BUỘC]
Hãy trả về kết quả chính xác theo định dạng JSON sau, không thêm bất kỳ văn bản nào khác ngoài JSON:
{{
  "years_of_experience": "Số năm kinh nghiệm tìm thấy (VD: 0, 1.5, 2)",
  "matches": ["Mã kỹ năng khớp 1", "Mã kỹ năng khớp 2"],
  "cv_score": "Tổng điểm số nguyên từ 0-100",
  "summary": "Tóm tắt ngắn gọn năng lực ứng viên trong 1 câu"
}}

[EXTRA RUBRIC INSTRUCTIONS]
{rubric}
"""

VOICE_INTERVIEW_SYSTEM_PROMPT = """
You are an AI interviewer representing the company. Ask technical questions based on the candidate's CV and evaluate their answers. Keep your responses concise.
"""
