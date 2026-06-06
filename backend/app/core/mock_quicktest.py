from __future__ import annotations

from uuid import UUID

from app.schemas.module1 import TestQuestion, TestQuestionStatus


def _options(*items: tuple[str, str]) -> list[dict[str, str]]:
    return [{"id": option_id, "text": text} for option_id, text in items]


TELLER_QUESTIONS = [
    {
        "question_text": "Khi khach hang nop tien mat tai quay, kiem soat nao can thuc hien truoc khi hach toan giao dich?",
        "skill_tag": "Quy trinh tien gui",
        "difficulty": "Easy",
        "options": _options(
            ("A", "Doi chieu giay to dinh danh, chung tu va kiem dem tien truoc mat khach hang."),
            ("B", "Hach toan truoc de rut ngan thoi gian cho."),
            ("C", "Chi can hoi lai so tien khach muon nop."),
            ("D", "Gop tien cua nhieu khach roi kiem dem cuoi ngay."),
        ),
        "correct_option_id": "A",
        "explanation": "Giao dich vien phai xac thuc khach hang, chung tu va tien mat truoc khi ghi nhan giao dich.",
    },
    {
        "question_text": "Dau hieu nao la tin hieu rui ro can kiem tra them khi nhan tien mat?",
        "skill_tag": "Phan biet tien that gia",
        "difficulty": "Medium",
        "options": _options(
            ("A", "Hinh chim, day bao hiem hoac chat lieu giay/polymer co bat thuong."),
            ("B", "Menh gia tien khac nhau trong cung bo tien."),
            ("C", "Khach hang yeu cau bien nhan giao dich."),
            ("D", "Khach hang di cung nguoi than."),
        ),
        "correct_option_id": "A",
        "explanation": "Cac dac diem bao an bat thuong la can cu de tam dung va kiem tra tien nghi gia theo quy trinh.",
    },
    {
        "question_text": "Neu so tien thuc nhan lech voi chung tu khach da lap, buoc xu ly phu hop nhat la gi?",
        "skill_tag": "Kiem soat giao dich quay",
        "difficulty": "Medium",
        "options": _options(
            ("A", "Thong bao chenh lech, kiem dem lai truoc mat khach va yeu cau dieu chinh chung tu."),
            ("B", "Tu sua so tien tren chung tu va tiep tuc giao dich."),
            ("C", "Hach toan theo chung tu de tranh sai quy trinh."),
            ("D", "Chuyen toan bo trach nhiem cho kiem soat vien sau giao dich."),
        ),
        "correct_option_id": "A",
        "explanation": "Chenh lech tien mat phai duoc lam ro cong khai truoc khi hach toan de tranh sai lech so quy.",
    },
    {
        "question_text": "Thong tin nao cua khach hang khong duoc tiet lo cho nguoi di cung tai quay?",
        "skill_tag": "Bao mat thong tin khach hang",
        "difficulty": "Easy",
        "options": _options(
            ("A", "So du tai khoan, lich su giao dich va thong tin dinh danh ca nhan."),
            ("B", "Ten chi nhanh giao dich."),
            ("C", "Gio lam viec cua ngan hang."),
            ("D", "Ten san pham tien gui cong khai."),
        ),
        "correct_option_id": "A",
        "explanation": "So du, lich su giao dich va du lieu dinh danh la thong tin bao mat cua khach hang.",
    },
    {
        "question_text": "Trong giao dich nop tien vao tai khoan thanh toan, nguyen tac nghiep vu cot loi la gi?",
        "skill_tag": "Hach toan ngan hang co ban",
        "difficulty": "Hard",
        "options": _options(
            ("A", "Ghi nhan tang tien mat tai quy va tang so du tai khoan khach hang theo chung tu hop le."),
            ("B", "Chi ghi tang so du tai khoan, cuoi ngay moi ghi nhan quy tien mat."),
            ("C", "Ghi nhan giao dich sau khi khach roi quay."),
            ("D", "Khong can chung tu neu khach da quen giao dich."),
        ),
        "correct_option_id": "A",
        "explanation": "Giao dich phai phan anh dong thoi tien mat thuc nhan va nghia vu ghi co vao tai khoan khach hang.",
    },
]


RELATIONSHIP_MANAGER_QUESTIONS = [
    {
        "question_text": "Chi so nao thuong duoc dung de danh gia kha nang tra no tu dong tien cua doanh nghiep?",
        "skill_tag": "Phan tich bao cao tai chinh",
        "difficulty": "Medium",
        "options": _options(
            ("A", "DSCR hoac dong tien hoat dong so voi nghia vu no."),
            ("B", "So luong nhan vien trong phong ke toan."),
            ("C", "Mau sac bo nhan dien thuong hieu."),
            ("D", "So nam thue van phong."),
        ),
        "correct_option_id": "A",
        "explanation": "Kha nang tra no can duoc kiem tra bang dong tien va nghia vu no, khong chi bang doanh thu danh nghia.",
    },
    {
        "question_text": "Khi tham dinh tai san bao dam, yeu to nao can duoc kiem tra dong thoi?",
        "skill_tag": "Tai san bao dam",
        "difficulty": "Medium",
        "options": _options(
            ("A", "Gia tri, tinh phap ly, kha nang thanh khoan va quyen so huu/han che chuyen nhuong."),
            ("B", "Chi dien tich tai san."),
            ("C", "Chi loi cam ket mieng cua ben vay."),
            ("D", "Chi anh chup tai san."),
        ),
        "correct_option_id": "A",
        "explanation": "Tai san bao dam phai du gia tri, hop phap va co kha nang xu ly khi phat sinh rui ro.",
    },
    {
        "question_text": "Dau hieu nao co the canh bao rui ro no xau cua khach hang doanh nghiep?",
        "skill_tag": "Nhan dien rui ro tin dung",
        "difficulty": "Hard",
        "options": _options(
            ("A", "Doanh thu tang nhung dong tien hoat dong am keo dai va vong quay phai thu xau di."),
            ("B", "Doanh nghiep doi mau logo."),
            ("C", "Doanh nghiep tuyen them nhan vien ban hang."),
            ("D", "Khach hang hoi them ve san pham khac cua ngan hang."),
        ),
        "correct_option_id": "A",
        "explanation": "Tang truong doanh thu khong di cung dong tien va thu hoi cong no la tin hieu rui ro can phan tich sau.",
    },
    {
        "question_text": "Trong quy trinh tham dinh tin dung, buoc nao giup xac minh muc dich vay von la hop ly?",
        "skill_tag": "Quy trinh tham dinh tin dung",
        "difficulty": "Easy",
        "options": _options(
            ("A", "Doi chieu phuong an vay voi hop dong, hoa don, dong tien va hoat dong thuc te."),
            ("B", "Chi xem khach hang trinh bay co tu tin hay khong."),
            ("C", "Bo qua vi da co tai san bao dam."),
            ("D", "Chi kiem tra website doanh nghiep."),
        ),
        "correct_option_id": "A",
        "explanation": "Muc dich vay can duoc kiem chung bang ho so, dong tien va hoat dong kinh doanh thuc te.",
    },
    {
        "question_text": "Neu ty le no vay tren von chu so huu tang nhanh qua nhieu ky, nhan dinh nao phu hop nhat?",
        "skill_tag": "Phan tich don bay tai chinh",
        "difficulty": "Medium",
        "options": _options(
            ("A", "Can danh gia them rui ro don bay, ap luc lai vay va kha nang dap ung nghia vu no."),
            ("B", "Doanh nghiep chac chan tang truong tot nen co the bo qua."),
            ("C", "Chi can tang han muc tin dung ngay."),
            ("D", "Khong lien quan den quyet dinh tin dung."),
        ),
        "correct_option_id": "A",
        "explanation": "Don bay tang nhanh co the lam tang rui ro thanh toan va can kiem tra cung dong tien, loi nhuan va tai san bao dam.",
    },
]


COMMON_COMPLIANCE_QUESTIONS = [
    {
        "question_text": "Khi nghi ngo giao dich co dau hieu bat thuong, nhan su ngan hang nen lam gi?",
        "skill_tag": "Tuan thu va kiem soat rui ro",
        "difficulty": "Medium",
        "options": _options(
            ("A", "Ghi nhan day du, bao cao theo tuyen kiem soat va khong tu y bo qua canh bao."),
            ("B", "Tiep tuc giao dich vi khach hang dang voi."),
            ("C", "Hoi y kien nguoi quen ngoai ngan hang."),
            ("D", "Xoa dau hieu canh bao de tranh anh huong chi tieu."),
        ),
        "correct_option_id": "A",
        "explanation": "Giao dich bat thuong phai duoc xu ly theo quy trinh tuan thu va kiem soat noi bo.",
    },
    {
        "question_text": "Muc tieu chinh cua viec phan quyen truy cap thong tin khach hang la gi?",
        "skill_tag": "Bao mat thong tin",
        "difficulty": "Easy",
        "options": _options(
            ("A", "Dam bao chi nguoi co nhu cau nghiep vu hop le duoc xem va xu ly du lieu."),
            ("B", "Giup moi nhan vien xem du lieu nhanh hon."),
            ("C", "Thay the hoan toan kiem tra chung tu."),
            ("D", "Giam nhu cau luu vet truy cap."),
        ),
        "correct_option_id": "A",
        "explanation": "Phan quyen la kiem soat nen tang de bao ve du lieu khach hang va dap ung yeu cau tuan thu.",
    },
]


def mock_quicktest_questions(campaign_id: UUID, title: str | None = None, jd_text: str | None = None, count: int = 12) -> list[TestQuestion]:
    """Return deterministic hackathon Quicktest questions without any AI generation."""
    role_text = f"{title or ''} {jd_text or ''}".lower()
    if any(keyword in role_text for keyword in ["qkhh", "quan he khach hang", "relationship", "tin dung", "credit"]):
        base_questions = RELATIONSHIP_MANAGER_QUESTIONS + COMMON_COMPLIANCE_QUESTIONS + TELLER_QUESTIONS
    elif any(keyword in role_text for keyword in ["giao dich vien", "teller", "quay", "tien gui"]):
        base_questions = TELLER_QUESTIONS + COMMON_COMPLIANCE_QUESTIONS + RELATIONSHIP_MANAGER_QUESTIONS
    else:
        base_questions = RELATIONSHIP_MANAGER_QUESTIONS + TELLER_QUESTIONS + COMMON_COMPLIANCE_QUESTIONS

    selected = base_questions[: max(10, min(count, len(base_questions)))]
    return [
        TestQuestion(
            campaign_id=campaign_id,
            question_text=item["question_text"],
            question_type="multiple_choice",
            difficulty=item["difficulty"],
            skill_tag=item["skill_tag"],
            options=item["options"],
            correct_option_id=item["correct_option_id"],
            explanation=item["explanation"],
            status=TestQuestionStatus.APPROVED,
            order_index=index,
        )
        for index, item in enumerate(selected, start=1)
    ]
