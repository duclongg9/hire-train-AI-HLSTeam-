from __future__ import annotations

from typing import Any

from app.schemas.module1 import (
    Candidate,
    CandidateBadge,
    CandidateScore,
    InterviewEvent,
    InterviewReport,
    InterviewSession,
    RubricCategory,
    RubricCriterion,
    TestQuestion,
    TestQuestionStatus,
)
from app.services.ai.base import AIProvider


def _normalized(text: str | None) -> str:
    return (text or "").casefold()


def _looks_like_shb_retail_jd(text: str | None) -> bool:
    normalized = _normalized(text)
    return any(
        keyword in normalized
        for keyword in (
            "quan hệ khách hàng cá nhân",
            "quan he khach hang ca nhan",
            "khách hàng cá nhân",
            "khach hang ca nhan",
            "tín dụng cá nhân",
            "tin dung ca nhan",
            "huy động vốn",
            "huy dong von",
            "shb",
        )
    )


def _looks_like_kim_anh_cv(text: str | None) -> bool:
    normalized = _normalized(text)
    return any(
        keyword in normalized
        for keyword in (
            "lê thị kim anh",
            "le thi kim anh",
            "kim anh",
            "standard chartered",
            "hsbc",
            "aum",
            "relationship manager",
            "quan hệ khách hàng",
        )
    )


class MockAIProvider(AIProvider):
    def analyze_jd(self, position_id, jd_text: str) -> list[RubricCriterion]:
        if _looks_like_shb_retail_jd(jd_text):
            return [
                RubricCriterion(position_id=position_id, category=RubricCategory.experience, name="Kinh nghiệm tín dụng cá nhân", weight=25, description="Hiểu quy trình thẩm định, phê duyệt và quản lý khoản vay khách hàng cá nhân."),
                RubricCriterion(position_id=position_id, category=RubricCategory.soft_skill, name="Phát triển và chăm sóc khách hàng", weight=25, description="Tìm kiếm khách hàng mới, duy trì quan hệ và mở rộng tệp khách hàng hiện hữu."),
                RubricCriterion(position_id=position_id, category=RubricCategory.hard_skill, name="Bán chéo sản phẩm ngân hàng", weight=20, description="Tư vấn huy động, thẻ, bảo hiểm và sản phẩm cá nhân phù hợp nhu cầu khách hàng."),
                RubricCriterion(position_id=position_id, category=RubricCategory.certification, name="Tuân thủ và quản trị rủi ro", weight=15, description="Nắm nguyên tắc KYC, AML, hồ sơ tín dụng và kiểm soát rủi ro vận hành."),
                RubricCriterion(position_id=position_id, category=RubricCategory.hard_skill, name="KPI, CRM và báo cáo bán hàng", weight=15, description="Theo dõi pipeline, cập nhật CRM, lập kế hoạch và báo cáo kết quả kinh doanh."),
            ]

        return [
            RubricCriterion(position_id=position_id, category=RubricCategory.hard_skill, name="CRM and ticket handling", weight=25, description="Uses CRM tools and keeps complete case notes."),
            RubricCriterion(position_id=position_id, category=RubricCategory.soft_skill, name="Communication and empathy", weight=30, description="Explains clearly and de-escalates frustrated customers."),
            RubricCriterion(position_id=position_id, category=RubricCategory.experience, name="Customer support experience", weight=25, description="Has relevant support or service operations experience."),
            RubricCriterion(position_id=position_id, category=RubricCategory.hard_skill, name="Problem solving", weight=15, description="Diagnoses issues and coordinates practical next steps."),
            RubricCriterion(position_id=position_id, category=RubricCategory.certification, name="Relevant training", weight=5, description="Customer service, communication, or product support training."),
        ]

    def generate_test_questions(self, position_id, jd_text: str, rubric: list[RubricCriterion], count: int = 15) -> list[TestQuestion]:
        if _looks_like_shb_retail_jd(jd_text):
            shb_questions = [
                (
                    "Một khách hàng cá nhân muốn vay mua nhà nhưng nguồn thu nhập chính đến từ kinh doanh hộ gia đình. Bạn sẽ kiểm tra gì trước khi đề xuất hạn mức?",
                    "Hồ sơ pháp lý, chứng từ dòng tiền, lịch sử tín dụng, tài sản bảo đảm và phương án trả nợ",
                    "Thẩm định tín dụng cá nhân cần đánh giá đủ năng lực pháp lý, dòng tiền, CIC, tài sản bảo đảm và khả năng trả nợ.",
                    "medium",
                    "tín dụng cá nhân",
                ),
                (
                    "Khi phát hiện khách hàng có dấu hiệu che giấu khoản vay tại tổ chức tín dụng khác, hành động phù hợp nhất là gì?",
                    "Xác minh CIC, yêu cầu giải trình và cập nhật đánh giá rủi ro trước khi trình hồ sơ",
                    "RM cần xác minh thông tin, ghi nhận rủi ro và đảm bảo hồ sơ minh bạch trước khi đề xuất.",
                    "medium",
                    "quản trị rủi ro",
                ),
                (
                    "Một khách hàng có tiền gửi lớn sắp đáo hạn và đang cân nhắc chuyển sang ngân hàng khác. Bạn nên xử lý thế nào?",
                    "Tư vấn lại nhu cầu, đề xuất gói lãi suất/sản phẩm phù hợp và hẹn lịch chăm sóc sau giao dịch",
                    "Giữ chân khách hàng cần hiểu nhu cầu, tư vấn giải pháp và chăm sóc chủ động.",
                    "easy",
                    "huy động vốn",
                ),
                (
                    "Chỉ số nào phản ánh trực tiếp hiệu quả quản lý pipeline bán hàng của chuyên viên quan hệ khách hàng?",
                    "Số lượng hồ sơ đang ở từng giai đoạn và tỷ lệ chuyển đổi",
                    "Pipeline cần được đo bằng số lượng cơ hội, giai đoạn xử lý, tỷ lệ chuyển đổi và giá trị dự kiến.",
                    "easy",
                    "crm",
                ),
                (
                    "Trong quy trình KYC, thông tin nào cần được kiểm tra kỹ nhất trước khi mở quan hệ với khách hàng mới?",
                    "Danh tính, nguồn tiền, mục đích giao dịch và dấu hiệu rủi ro AML",
                    "KYC tập trung vào xác minh danh tính, nguồn tiền, mục đích giao dịch và phòng chống rửa tiền.",
                    "medium",
                    "tuân thủ",
                ),
                (
                    "Khách hàng muốn tất toán khoản vay trước hạn vì được ngân hàng khác chào lãi suất thấp hơn. Cách phản hồi tốt nhất là gì?",
                    "Phân tích tổng chi phí chuyển đổi, tìm hiểu lý do, đề xuất phương án giữ chân nếu phù hợp chính sách",
                    "RM cần tư vấn dựa trên lợi ích tổng thể, chính sách ngân hàng và cơ hội duy trì quan hệ.",
                    "hard",
                    "chăm sóc khách hàng",
                ),
                (
                    "Một khách hàng có thu nhập cao nhưng lịch sử trả nợ từng quá hạn nhóm 2. Bạn nên đánh giá thế nào?",
                    "Phân tích nguyên nhân quá hạn, xu hướng khắc phục, dòng tiền hiện tại và điều kiện kiểm soát bổ sung",
                    "Rủi ro tín dụng cần được đánh giá theo nguyên nhân, khả năng phục hồi, dòng tiền và biện pháp giảm thiểu.",
                    "hard",
                    "tín dụng cá nhân",
                ),
                (
                    "Mục tiêu bán chéo sản phẩm nên được thực hiện theo nguyên tắc nào?",
                    "Tư vấn dựa trên nhu cầu, khả năng tài chính và mức độ phù hợp của khách hàng",
                    "Bán chéo hiệu quả phải dựa trên nhu cầu thực, phù hợp tài chính và tuân thủ tư vấn.",
                    "medium",
                    "bán chéo",
                ),
                (
                    "Khi một hồ sơ tín dụng bị thiếu chứng từ chứng minh thu nhập, lựa chọn nào đúng nhất?",
                    "Yêu cầu bổ sung chứng từ hợp lệ hoặc đề xuất phương án thẩm định thay thế được phê duyệt",
                    "Hồ sơ tín dụng cần căn cứ chứng từ hợp lệ hoặc phương án thay thế được kiểm soát theo quy định.",
                    "medium",
                    "tín dụng cá nhân",
                ),
                (
                    "Trong chăm sóc khách hàng cá nhân, hành vi nào thể hiện chất lượng dịch vụ tốt nhất?",
                    "Chủ động nhắc lịch, cập nhật trạng thái hồ sơ, giải thích rõ điều kiện và phản hồi đúng hẹn",
                    "Dịch vụ tốt cần chủ động, minh bạch, đúng hẹn và duy trì niềm tin với khách hàng.",
                    "easy",
                    "chăm sóc khách hàng",
                ),
            ]
            questions: list[TestQuestion] = []
            for index, (stem, correct_text, explanation, difficulty, skill_tag) in enumerate(shb_questions[:count], start=1):
                questions.append(
                    TestQuestion(
                        position_id=position_id,
                        question_text=stem,
                        difficulty=difficulty,
                        skill_tag=skill_tag,
                        options=[
                            {"id": "A", "text": correct_text},
                            {"id": "B", "text": "Chỉ xử lý nhanh để kịp KPI, chưa cần kiểm chứng đầy đủ."},
                            {"id": "C", "text": "Chuyển hoàn toàn cho bộ phận khác và không theo dõi tiếp."},
                            {"id": "D", "text": "Ưu tiên bán sản phẩm trước, bổ sung hồ sơ sau."},
                        ],
                        correct_option_id="A",
                        explanation=explanation,
                        status=TestQuestionStatus.APPROVED,
                        order_index=index,
                    )
                )
            return questions

        stems = [
            "A customer has contacted support three times without resolution. What should you do first?",
            "Which CRM note is most useful for the next support agent?",
            "A customer asks for a refund that policy does not allow. What is the best response?",
            "How should urgent support tickets be prioritized?",
            "A product bug affects several customers. What should support do?",
            "What is the best way to confirm you understood a customer issue?",
            "A customer uses angry language in chat. What should you avoid?",
            "When should a ticket be escalated to engineering?",
            "What makes a support handoff effective?",
            "How should recurring customer complaints be documented?",
            "A customer reports the same problem after a workaround. What is the best next step?",
            "What is the strongest closing message after resolving a support case?",
            "How should a support agent respond when they need more investigation time?",
            "Which metric best reflects consistent support follow-through?",
            "What should be included in a bug escalation summary?",
            "How do you handle a customer who misunderstands product behavior?",
            "What is the best reason to tag a ticket accurately?",
            "How should sensitive customer information be handled?",
            "What should you do after spotting a recurring issue trend?",
            "How should you balance speed and accuracy in support?",
        ]
        questions: list[TestQuestion] = []
        for index, stem in enumerate(stems[:count], start=1):
            questions.append(
                TestQuestion(
                    position_id=position_id,
                    question_text=stem,
                    difficulty="medium" if index % 3 else "hard",
                    skill_tag="customer_support",
                    options=[
                        {"id": "A", "text": "Acknowledge the issue, verify context, and define a clear next step."},
                        {"id": "B", "text": "Ask the customer to start over with a new ticket."},
                        {"id": "C", "text": "Close the case if the answer is not obvious."},
                        {"id": "D", "text": "Promise an outcome before reviewing the facts."},
                    ],
                    correct_option_id="A",
                    explanation="The best option is structured, empathetic, and fact-based.",
                    status=TestQuestionStatus.APPROVED,
                    order_index=index,
                )
            )
        return questions

    def score_candidate(self, candidate: Candidate, rubric: list[RubricCriterion]) -> CandidateScore:
        if _looks_like_kim_anh_cv(candidate.cv_text) or _looks_like_kim_anh_cv(candidate.full_name):
            return CandidateScore(
                candidate_id=candidate.id,
                position_id=candidate.position_id,
                score=95.0,
                badge=CandidateBadge.STRONG,
                ai_reasoning="Mock AI matched CV_10_LeThiKimAnh.pdf with the SHB retail relationship manager JD. The profile strongly fits retail banking, credit advisory, customer portfolio growth, cross-selling and KPI ownership.",
                score_breakdown={
                    "Kinh nghiệm tín dụng cá nhân": 24,
                    "Phát triển và chăm sóc khách hàng": 25,
                    "Bán chéo sản phẩm ngân hàng": 19,
                    "Tuân thủ và quản trị rủi ro": 14,
                    "KPI, CRM và báo cáo bán hàng": 13,
                },
                risk_flags=["Cần xác nhận thêm mức độ phù hợp với quy trình nội bộ và khẩu vị rủi ro của SHB."],
            )

        text = (candidate.cv_text or "").lower()
        keyword_scores = {
            "crm": 18 if "crm" in text or "zendesk" in text else 6,
            "communication": 20 if "communication" in text or "chat" in text else 8,
            "experience": 20 if "years" in text or "senior" in text or "experience" in text else 10,
            "problem_solving": 17 if "resolution" in text or "escalation" in text or "problem" in text else 7,
            "empathy": 12 if "empathy" in text or "conflict" in text or "customer" in text else 5,
        }
        repeated = any(text.count(word) >= 8 for word in ["expert", "perfect", "guaranteed", "best"])
        score = min(100, sum(keyword_scores.values()))
        risk_flags = []
        badge = CandidateBadge.STRONG if score >= 75 else CandidateBadge.GAP
        if repeated:
            score = min(score, 55)
            badge = CandidateBadge.HIGH_RISK
            risk_flags.append("Repeated suspicious self-promotional keywords detected.")
        return CandidateScore(
            candidate_id=candidate.id,
            position_id=candidate.position_id,
            score=round(score, 2),
            badge=badge,
            ai_reasoning="Mock AI compared the CV text with the saved rubric and customer support keywords.",
            score_breakdown=keyword_scores,
            risk_flags=risk_flags,
        )

    def score_test_attempt(self, answers: list[dict[str, Any]], questions: list[TestQuestion]) -> dict[str, Any]:
        question_map = {str(question.id): question for question in questions}
        scored_answers = []
        correct = 0
        for answer in answers:
            question = question_map.get(str(answer.get("question_id")))
            selected = answer.get("selected_option_id")
            is_correct = bool(question and selected == question.correct_option_id)
            correct += 1 if is_correct else 0
            scored_answers.append({**answer, "is_correct": is_correct})
        max_score = len(questions)
        percentage = round((correct / max_score) * 100, 2) if max_score else 0
        return {
            "score": correct,
            "max_score": max_score,
            "percentage": percentage,
            "answers": scored_answers,
            "ai_feedback": f"Candidate answered {correct} of {max_score} questions correctly.",
        }

    def generate_interview_report(self, session: InterviewSession, events: list[InterviewEvent]) -> InterviewReport:
        transcript = [
            {"speaker": event.speaker, "text": event.text, "event_type": event.event_type, "created_at": event.created_at.isoformat()}
            for event in events
            if event.text
        ]
        candidate_lines = [event.text or "" for event in events if event.speaker == "candidate"]
        depth_bonus = min(10, len(" ".join(candidate_lines)) // 80)
        radar = {
            "communication": 78 + depth_bonus,
            "problem_solving": 74 + depth_bonus,
            "empathy": 82,
            "domain_knowledge": 72 + depth_bonus,
            "stress_handling": 80,
            "clarity": 81,
        }
        return InterviewReport(
            candidate_id=session.candidate_id,
            campaign_id=session.campaign_id,
            interview_session_id=session.id,
            transcript=transcript,
            radar_scores=radar,
            summary="Candidate completed the mock AI interview with structured responses and acceptable support judgment.",
            strengths=["Clear communication", "Empathetic tone", "Good ownership of next steps"],
            weaknesses=["Could provide more measurable follow-up commitments"],
            recommendation="Recommended for final HR review." if radar["communication"] >= 80 else "Review carefully before final decision.",
        )

    def generate_candidate_feedback(self, candidate: Candidate, decision: str, context: dict[str, Any]) -> str:
        if decision == "PASSED":
            return f"Dear {candidate.full_name}, congratulations. Your application has progressed successfully, and our HR team will contact you with next steps."
        return f"Dear {candidate.full_name}, thank you for taking part in the process. We will not move forward at this time, but we appreciate your effort and interest."

    def extract_candidate_info(self, cv_text: str) -> dict[str, str | None]:
        if _looks_like_kim_anh_cv(cv_text):
            return {
                "full_name": "Lê Thị Kim Anh",
                "email": "kimanh.mock@example.com",
                "phone": "0900000010",
            }

        # Simple mock regex extraction
        import re
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', cv_text)
        phone_match = re.search(r'\+?\d[\d -]{8,12}\d', cv_text)
        
        # Simple name heuristic: first line or default
        lines = [l.strip() for l in cv_text.split('\n') if l.strip()]
        name = lines[0] if lines else "Mock Candidate"
        if len(name) > 50 or "@" in name or any(char.isdigit() for char in name):
            name = "Mock Candidate"

        return {
            "full_name": name,
            "email": email_match.group(0) if email_match else "mock.candidate@example.com",
            "phone": phone_match.group(0) if phone_match else "0987654321",
        }
