/* =========================================================================
   AfterCare · data.js — single source of truth
   Clinician-facing content in Vietnamese. Plain language, no dev jargon.
   ========================================================================= */

const HOSPITAL = { name: "Bệnh viện X", updated: "16/06/2026" };
const CURRENT_USER = { name: "BS. Vũ Văn Côi", role: "Khoa Tim mạch", initials: "VC" };

/* people the doctor can assign work to */
const STAFF = [
  "ĐD. Trần Thu Hà", "ĐD. Lê Minh Khoa", "ĐD. Phạm Bích Ngọc", "BS. Vũ Văn Côi",
];
const SPECIALTIES = ["Tim mạch", "Hô hấp", "Nội tiết", "Ngoại chấn thương", "Nội tổng quát"];
const DOCTORS = ["BS. Vũ Văn Côi", "BS. Nguyễn Lan Anh", "BS. Đặng Quốc Huy"];

/* grouped sidebar navigation */
const NAV_GROUPS = [
  {
    label: "Lâm sàng",
    items: [
      { page: "dashboard",    label: "Bảng điều phối", href: "index.html" },
      { page: "patients",     label: "Bệnh nhân",       href: "patients.html" },
      { page: "appointments", label: "Lịch hẹn",        href: "appointments.html" },
    ],
  },
  {
    label: "Trợ lý gọi tự động",
    items: [
      { page: "manager", label: "Quản lý gọi AI", href: "manager.html" },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { page: "settings", label: "Cài đặt", href: "settings.html" },
    ],
  },
];

/* label maps shared everywhere */
const RISK = {
  red:   { label: "Nguy cơ cao", short: "Cao" },
  amber: { label: "Cần theo dõi", short: "Theo dõi" },
  green: { label: "Ổn định",      short: "Ổn định" },
};
const CALL_STATUS = {
  scheduled:   { label: "Đã lên lịch", tone: "info" },
  completed:   { label: "Đã gọi xong", tone: "green" },
  failed:      { label: "Gọi thất bại", tone: "red" },
  in_progress: { label: "Đang gọi",     tone: "amber" },
  none:        { label: "Chưa lên lịch", tone: "muted" },
};

/* =========================================================================
   Patients — the clinical roster. MRN = mã hồ sơ.
   ========================================================================= */
const PATIENTS = [
  {
    mrn: "10472", name: "Trần Văn Hùng", age: 67, sex: "Nam",
    diagnosis: "Suy tim + Đái tháo đường type 2", group: "Suy tim",
    risk: "red", doctor: "BS. Vũ Văn Côi", dischargeDate: "06/06/2026", day: 7,
    lastContact: "Hôm nay 09:42", reason: "Khó thở khi nằm + phù chân tăng",
    summary: "Khó thở cả khi nằm, đêm phải ngồi dậy; chân sưng to hơn. Tự ngưng lợi tiểu 2 ngày.",
    aiConfidence: 92, adherence: 60,
    nextCall: { date: "17/06", time: "09:00", status: "scheduled" },
    overdue: false, manual: true, needsReview: true,
  },
  {
    mrn: "10488", name: "Lê Thị Mai", age: 72, sex: "Nữ",
    diagnosis: "COPD sau đợt cấp", group: "COPD",
    risk: "red", doctor: "BS. Nguyễn Lan Anh", dischargeDate: "13/06/2026", day: 3,
    lastContact: "Hôm nay 09:30", reason: "Oxy máu tự đo dưới 90%",
    summary: "Ho nhiều đờm vàng, thở mệt khi đi lại trong nhà, sốt nhẹ.",
    aiConfidence: 88, adherence: 80,
    nextCall: { date: "17/06", time: "09:30", status: "scheduled" },
    overdue: false, manual: false, needsReview: true,
  },
  {
    mrn: "10455", name: "Phạm Quốc Anh", age: 59, sex: "Nam",
    diagnosis: "Đái tháo đường type 2", group: "Đái tháo đường",
    risk: "amber", doctor: "BS. Đặng Quốc Huy", dischargeDate: "02/06/2026", day: 14,
    lastContact: "Hôm qua 14:25", reason: "Tự ngưng thuốc",
    summary: "Quên uống metformin 3 hôm vì thấy “đỡ”, đường huyết sáng 11.2 mmol/L.",
    aiConfidence: 74, adherence: 45,
    nextCall: { date: "16/06", time: "10:15", status: "failed" },
    overdue: true, manual: false, needsReview: true,
  },
  {
    mrn: "10501", name: "Nguyễn Thị Lan", age: 64, sex: "Nữ",
    diagnosis: "Hậu phẫu thay khớp gối", group: "Hậu phẫu",
    risk: "amber", doctor: "BS. Vũ Văn Côi", dischargeDate: "11/06/2026", day: 5,
    lastContact: "Hôm qua 14:15", reason: "Đau vết mổ tăng",
    summary: "Vết mổ hơi đỏ, đau khi cử động; chưa sốt, ăn uống bình thường.",
    aiConfidence: 69, adherence: 90,
    nextCall: { date: "18/06", time: "14:00", status: "scheduled" },
    overdue: false, manual: true, needsReview: false,
  },
  {
    mrn: "10399", name: "Đỗ Minh Tâm", age: 55, sex: "Nam",
    diagnosis: "Tăng huyết áp", group: "Tăng huyết áp",
    risk: "green", doctor: "BS. Đặng Quốc Huy", dischargeDate: "01/06/2026", day: 15,
    lastContact: "Hôm qua 14:00", reason: "Trong ngưỡng an toàn",
    summary: "Uống thuốc đều, huyết áp 128/82, không triệu chứng bất thường.",
    aiConfidence: 96, adherence: 98,
    nextCall: { date: "20/06", time: "08:30", status: "scheduled" },
    overdue: false, manual: false, needsReview: false,
  },
  {
    mrn: "10362", name: "Hoàng Văn Sơn", age: 61, sex: "Nam",
    diagnosis: "Suy tim sau đợt cấp", group: "Suy tim",
    risk: "green", doctor: "BS. Vũ Văn Côi", dischargeDate: "20/05/2026", day: 27,
    lastContact: "15/06 09:42", reason: "Trong ngưỡng an toàn",
    summary: "Cân nặng ổn định, không khó thở, đã đặt lịch tái khám.",
    aiConfidence: 95, adherence: 92,
    nextCall: { date: "—", time: "", status: "none" },
    overdue: false, manual: false, needsReview: false,
  },
  {
    mrn: "10510", name: "Vũ Thị Hồng", age: 78, sex: "Nữ",
    diagnosis: "Suy tim", group: "Suy tim",
    risk: "amber", doctor: "BS. Nguyễn Lan Anh", dischargeDate: "08/06/2026", day: 8,
    lastContact: "13/06 10:10", reason: "Chưa liên lạc được 2 ngày",
    summary: "Hai lần gọi gần nhất không bắt máy. Cần điều dưỡng liên hệ qua người nhà.",
    aiConfidence: 0, adherence: 70,
    nextCall: { date: "16/06", time: "11:00", status: "failed" },
    overdue: true, manual: false, needsReview: false,
  },
  {
    mrn: "10523", name: "Bùi Đức Thành", age: 53, sex: "Nam",
    diagnosis: "Hậu phẫu ổ bụng", group: "Hậu phẫu",
    risk: "green", doctor: "BS. Đặng Quốc Huy", dischargeDate: "10/06/2026", day: 6,
    lastContact: "14/06 16:00", reason: "Trong ngưỡng an toàn",
    summary: "Vết mổ khô, ăn uống tốt, đi lại nhẹ nhàng.",
    aiConfidence: 90, adherence: 88,
    nextCall: { date: "19/06", time: "09:00", status: "scheduled" },
    overdue: false, manual: false, needsReview: false,
  },
];

/* =========================================================================
   Dashboard work queues
   ========================================================================= */
function patientsBy(pred) { return PATIENTS.filter(pred); }
const QUEUE_NEEDS_REVIEW = () => patientsBy(p => p.needsReview);
const QUEUE_OVERDUE      = () => patientsBy(p => p.overdue);

/* AI calls scheduled for the demo "today" (16/06) */
const AI_CALLS_TODAY = [
  { mrn: "10455", name: "Phạm Quốc Anh", time: "10:15", group: "Đái tháo đường", status: "failed", attempt: 2 },
  { mrn: "10510", name: "Vũ Thị Hồng",   time: "11:00", group: "Suy tim",        status: "failed", attempt: 3 },
  { mrn: "10399", name: "Đỗ Minh Tâm",   time: "14:30", group: "Tăng huyết áp",  status: "scheduled", attempt: 1 },
  { mrn: "10523", name: "Bùi Đức Thành", time: "15:00", group: "Hậu phẫu",       status: "scheduled", attempt: 1 },
  { mrn: "10501", name: "Nguyễn Thị Lan", time: "16:00", group: "Hậu phẫu",      status: "scheduled", attempt: 1 },
];

const APPOINTMENTS_TODAY = [
  { mrn: "10472", name: "Trần Văn Hùng", time: "15:30", specialty: "Tim mạch", note: "Ưu tiên sau cảnh báo nguy cơ cao" },
];
const APPOINTMENTS = [
  { mrn: "10472", name: "Trần Văn Hùng", when: "16/06 · 15:30", specialty: "Tim mạch", note: "Ưu tiên sau cảnh báo nguy cơ cao", doctor: "BS. Vũ Văn Côi" },
  { mrn: "10501", name: "Nguyễn Thị Lan", when: "17/06 · 09:00", specialty: "Ngoại chấn thương", note: "Kiểm tra vết mổ và bài tập phục hồi", doctor: "BS. Vũ Văn Côi" },
  { mrn: "10455", name: "Phạm Quốc Anh", when: "18/06 · 10:15", specialty: "Nội tiết", note: "Rà soát tuân thủ thuốc đái tháo đường", doctor: "BS. Đặng Quốc Huy" },
];

/* =========================================================================
   Case detail — deep data keyed by MRN (full for 10472)
   ========================================================================= */
const CASES = {
  "10472": {
    matchedProtocol: {
      code: "Suy tim · Nguy cơ cao",
      criteria: "Khó thở khi nằm  +  phù chi tăng",
      action: "Bác sĩ liên hệ trong vòng 1 giờ",
    },
    escalationReason:
      "Bệnh nhân có 2 dấu hiệu mất bù tim đồng thời (khó thở khi nằm và phù chi tăng) " +
      "kèm tự ngưng lợi tiểu. Trợ lý đã nâng mức ưu tiên và báo người nhà ngay trong cuộc gọi.",
    slots: [
      { label: "Tuân thủ thuốc",        tone: "amber", value: "Tự ngưng lợi tiểu 2 ngày" },
      { label: "Khó thở khi nằm",       tone: "red",   value: "Có, đêm phải ngồi dậy" },
      { label: "Phù chi",               tone: "red",   value: "Tăng rõ" },
      { label: "Cân nặng",              tone: "grey",  value: "Chưa cân tại nhà" },
      { label: "Huyết áp / Đường huyết", tone: "green", value: "Uống đều, ổn" },
    ],
    trends: [
      { label: "Cân nặng (kg)", series: [68, 68.5, 69, 70, 71.5, 72.5], flagUp: true },
      { label: "Oxy máu (SpO₂ %)", series: [97, 96, 96, 95, 94, 93], flagUp: false },
      { label: "Nhịp tim (l/phút)", series: [78, 80, 82, 85, 88, 92], flagUp: true },
    ],
    previousCalls: [
      { date: "16/06", day: 7, duration: "3:24", outcome: "Nguy cơ cao", tone: "red",   note: "Khó thở khi nằm, phù tăng — đã báo bác sĩ & người nhà" },
      { date: "12/06", day: 3, duration: "2:05", outcome: "Ổn định",     tone: "green", note: "Uống thuốc đều, không triệu chứng mới" },
      { date: "10/06", day: 1, duration: "2:48", outcome: "Ổn định",     tone: "green", note: "Xác nhận đơn thuốc, dặn dò dấu hiệu nguy hiểm" },
    ],
    summary:
      "Bệnh nhân tuân thủ thuốc, nhưng tự ngưng lợi tiểu 2 ngày. Khó thở tăng, cả khi nằm, " +
      "đêm phải ngồi dậy; phù chân tăng. Chưa cân tại nhà. Đã hướng dẫn quy trình an toàn " +
      "(gọi 115 nếu nặng hơn) và thông báo người nhà.",
    transcript: [
      { who: "Trợ lý",  text: "Chào bác Hùng, cháu gọi từ bệnh viện. Dạo này bác thế nào rồi ạ?" },
      { who: "BÁC HÙNG", text: "Chào cháu. Bác thấy bình thường, nhưng chân hơi sưng to lên." },
      { who: "Trợ lý",  text: "Bác có khó thở không ạ, nhất là khi nằm?" },
      { who: "BÁC HÙNG", text: "Có, nằm là khó thở, phải ngồi dậy mới dễ chịu." },
      { who: "Trợ lý",  text: "Cháu sẽ báo bác sĩ ngay. Nếu khó thở tăng hay tức ngực, bác gọi 115 giúp cháu nhé." },
    ],
    family: "Minh (con) · đã đồng ý nhận thông báo",
    protocolCycle: "Suy tim · gọi ngày 1, 3, 7, 14, 30",
  },
};

/* =========================================================================
   AI Follow-up Manager
   ========================================================================= */

/* 1) Calendar */
const AI_CALENDAR = {
  workingHours: { start: "08:00", end: "17:00", days: ["T2", "T3", "T4", "T5", "T6"] },
  retry: { afterMin: 30, maxAttempts: 3 },
  blackout: ["18/06/2026 (nghỉ lễ)", "22/06/2026 (bảo trì hệ thống)"],
  week: {
    "T2": [{ time: "09:00", name: "Trần Văn Hùng", group: "Suy tim", status: "scheduled" }],
    "T3": [{ time: "09:30", name: "Lê Thị Mai", group: "COPD", status: "scheduled" },
           { time: "10:15", name: "Phạm Quốc Anh", group: "Đái tháo đường", status: "failed" }],
    "T4": [{ time: "08:30", name: "Đỗ Minh Tâm", group: "Tăng huyết áp", status: "scheduled" }],
    "T5": [{ time: "09:00", name: "Bùi Đức Thành", group: "Hậu phẫu", status: "scheduled" },
           { time: "14:00", name: "Nguyễn Thị Lan", group: "Hậu phẫu", status: "scheduled" }],
    "T6": [{ time: "11:00", name: "Vũ Thị Hồng", group: "Suy tim", status: "scheduled" }],
    "T7": [], "CN": [],
  },
  upcoming: [
    { when: "Hôm nay · 14:30", name: "Đỗ Minh Tâm", group: "Tăng huyết áp" },
    { when: "Hôm nay · 15:00", name: "Bùi Đức Thành", group: "Hậu phẫu" },
    { when: "Hôm nay · 16:00", name: "Nguyễn Thị Lan", group: "Hậu phẫu" },
    { when: "Mai · 09:00", name: "Trần Văn Hùng", group: "Suy tim" },
    { when: "Mai · 09:30", name: "Lê Thị Mai", group: "COPD" },
  ],
};

/* 2) Question templates */
const TEMPLATES = [
  {
    id: "hf", disease: "Suy tim", name: "Theo dõi suy tim", version: "v3", active: true,
    assign: "Tự động theo chẩn đoán: Suy tim",
    questions: [
      { text: "Bác có khó thở khi nằm không? Có phải ngồi dậy để thở không?", required: true },
      { text: "Chân hoặc mắt cá có sưng hơn mấy hôm nay không?", required: true,
        branch: { when: "Nếu có sưng tăng", ask: "Bác có tăng cân nhanh trong 3 ngày không?" } },
      { text: "Bác có uống thuốc lợi tiểu đều theo đơn không?", required: true },
      { text: "Bác có thấy tức ngực hoặc hồi hộp không?", required: false,
        branch: { when: "Nếu tức ngực", ask: "Cơn đau lan ra tay hay hàm không? (câu hỏi khẩn)" } },
    ],
    history: [
      { v: "v3", when: "10/06/2026", by: "BS. Vũ Văn Côi", note: "Thêm nhánh hỏi tăng cân" },
      { v: "v2", when: "21/05/2026", by: "BS. Vũ Văn Côi", note: "Bổ sung câu hỏi tức ngực" },
      { v: "v1", when: "02/05/2026", by: "Hệ thống", note: "Bản khởi tạo" },
    ],
  },
  {
    id: "copd", disease: "COPD", name: "Theo dõi COPD", version: "v2", active: true,
    assign: "Tự động theo chẩn đoán: COPD",
    questions: [
      { text: "Bác có ho nhiều đờm hơn hoặc đờm đổi màu không?", required: true },
      { text: "Có khó thở khi đi lại trong nhà không?", required: true },
      { text: "Bác có đo nồng độ oxy tại nhà không? Chỉ số khoảng bao nhiêu?", required: true,
        branch: { when: "Nếu dưới 90%", ask: "Bác có thấy môi hay đầu ngón tay tím không? (câu hỏi khẩn)" } },
      { text: "Có sốt hay ớn lạnh không?", required: false },
    ],
    history: [
      { v: "v2", when: "18/05/2026", by: "BS. Nguyễn Lan Anh", note: "Thêm nhánh oxy thấp" },
      { v: "v1", when: "30/04/2026", by: "Hệ thống", note: "Bản khởi tạo" },
    ],
  },
  {
    id: "dm", disease: "Đái tháo đường", name: "Theo dõi đái tháo đường", version: "v2", active: true,
    assign: "Tự động theo chẩn đoán: Đái tháo đường",
    questions: [
      { text: "Bác có uống thuốc tiểu đường đều mỗi ngày không?", required: true },
      { text: "Đường huyết đo buổi sáng khoảng bao nhiêu?", required: true },
      { text: "Có bị run tay, vã mồ hôi hay chóng mặt không?", required: false },
    ],
    history: [{ v: "v2", when: "12/05/2026", by: "BS. Đặng Quốc Huy", note: "Rút gọn còn 3 câu" }],
  },
  {
    id: "postop", disease: "Hậu phẫu", name: "Theo dõi hậu phẫu", version: "v1", active: true,
    assign: "Tự động theo chẩn đoán: Hậu phẫu",
    questions: [
      { text: "Vết mổ có đỏ, chảy dịch hay đau tăng không?", required: true },
      { text: "Bác có bị sốt không?", required: true },
      { text: "Bác có tập vận động theo hướng dẫn không?", required: false },
    ],
    history: [{ v: "v1", when: "05/05/2026", by: "Hệ thống", note: "Bản khởi tạo" }],
  },
  {
    id: "general", disease: "Tổng quát", name: "Theo dõi chung", version: "v1", active: false,
    assign: "Gán thủ công",
    questions: [
      { text: "Sức khỏe của bác mấy hôm nay thế nào?", required: true },
      { text: "Bác có uống thuốc đều không?", required: true },
      { text: "Có dấu hiệu gì khiến bác lo lắng không?", required: false },
    ],
    history: [{ v: "v1", when: "01/05/2026", by: "Hệ thống", note: "Bản khởi tạo" }],
  },
];

/* 3) Escalation rules */
const ESCALATION_RULES = [
  {
    id: "r1", name: "Suy tim mất bù", active: true,
    when: "Khó thở khi nằm = Có  VÀ  Phù chi = Tăng",
    risk: "red",
    recipients: ["Bác sĩ phụ trách", "Người nhà"],
    autoAppt: { on: true, specialty: "Tim mạch", within: "24 giờ" },
    approval: false,
  },
  {
    id: "r2", name: "Oxy máu thấp (COPD)", active: true,
    when: "Oxy máu tự đo < 90%",
    risk: "red",
    recipients: ["Bác sĩ phụ trách", "Điều dưỡng trực"],
    autoAppt: { on: false, specialty: "Hô hấp", within: "" },
    approval: true,
  },
  {
    id: "r3", name: "Tự ngưng thuốc tiểu đường", active: true,
    when: "Tự ngưng thuốc  HOẶC  đường huyết đói > 10 mmol/L",
    risk: "amber",
    recipients: ["Điều dưỡng phụ trách"],
    autoAppt: { on: true, specialty: "Nội tiết", within: "48 giờ" },
    approval: true,
  },
  {
    id: "r4", name: "Không liên lạc được", active: true,
    when: "Gọi thất bại ≥ 3 lần",
    risk: "amber",
    recipients: ["Điều dưỡng phụ trách"],
    autoAppt: { on: false, specialty: "", within: "" },
    approval: false,
  },
];

/* 4) AI performance (domain metrics, kept) */
const AI_PERFORMANCE = {
  range: "7 ngày qua",
  cards: [
    { value: "612", label: "Cuộc gọi hoàn thành", tone: "green" },
    { value: "47",  label: "Cuộc gọi thất bại",   tone: "red" },
    { value: "9,2%", label: "Tỷ lệ chuyển cảnh báo", tone: "amber" },
    { value: "2:51", label: "Thời lượng gọi trung bình", tone: "ink" },
    { value: "38",  label: "Lượt bác sĩ can thiệp", tone: "ink" },
  ],
  confidence: [
    { band: "Cao (≥ 85%)", pct: 64, tone: "green" },
    { band: "Trung bình (70–84%)", pct: 26, tone: "amber" },
    { band: "Thấp (< 70%)", pct: 10, tone: "red" },
  ],
  daily: [
    { d: "T2", done: 96, fail: 7 }, { d: "T3", done: 88, fail: 6 },
    { d: "T4", done: 102, fail: 9 }, { d: "T5", done: 79, fail: 5 },
    { d: "T6", done: 94, fail: 8 }, { d: "T7", done: 81, fail: 6 },
    { d: "CN", done: 72, fail: 6 },
  ],
};

/* 5) Notification center */
const NOTIFICATIONS = [
  { group: "Cuộc gọi thất bại", tone: "red", items: [
    { mrn: "10510", text: "Vũ Thị Hồng — gọi thất bại lần 3 (11:00)", action: "Mở ca" },
    { mrn: "10455", text: "Phạm Quốc Anh — gọi thất bại (10:15)", action: "Mở ca" },
  ]},
  { group: "Bệnh nhân được nâng cảnh báo", tone: "amber", items: [
    { mrn: "10472", text: "Trần Văn Hùng — nâng lên Nguy cơ cao (suy tim mất bù)", action: "Mở ca" },
  ]},
  { group: "Theo dõi quá hạn", tone: "amber", items: [
    { mrn: "10455", text: "Phạm Quốc Anh — quá hạn theo dõi ngày 14", action: "Mở ca" },
    { mrn: "10510", text: "Vũ Thị Hồng — chưa liên lạc được 2 ngày", action: "Mở ca" },
  ]},
  { group: "Nhắc lịch hẹn", tone: "info", items: [
    { mrn: "10472", text: "Trần Văn Hùng — tái khám Tim mạch hôm nay 15:30", action: "Xem lịch" },
  ]},
  { group: "Tin nhắn nhóm", tone: "muted", items: [
    { text: "ĐD. Trần Thu Hà: Đã gọi lại người nhà bác Hồng, hẹn 16h gọi lại.", action: "" },
  ]},
];

const CONDITIONS = ["Suy tim", "COPD", "Đái tháo đường", "Hậu phẫu", "Tăng huyết áp"];

/* ---- contact + quotes for manual calls and hover previews ------------- */
const PHONES = {
  "10472": { patient: "0912 345 678", family: "0987 111 222 (con: Minh)" },
  "10488": { patient: "0934 567 890", family: "0901 222 333 (con gái: Hoa)" },
  "10455": { patient: "0976 543 210", family: "0933 444 555 (vợ: Lan)" },
  "10501": { patient: "0908 121 314", family: "0967 888 999 (chồng: Bình)" },
  "10399": { patient: "0945 678 123", family: "—" },
  "10362": { patient: "0913 222 444", family: "0922 333 111 (con: Tú)" },
  "10510": { patient: "0978 000 111", family: "0966 555 777 (con: Đạt)" },
  "10523": { patient: "0902 333 666", family: "0911 777 888 (em: Hà)" },
};

/* latest patient quote (for hover preview / case) */
const QUOTES = {
  "10472": "“Nằm là khó thở, phải ngồi dậy mới dễ chịu.”",
  "10488": "“Đờm nhiều và vàng hơn, đi lại trong nhà cũng mệt.”",
  "10455": "“Tôi thấy đỡ nên nghỉ thuốc mấy hôm.”",
  "10501": "“Vết mổ hơi đau khi co chân, nhưng vẫn ăn ngủ được.”",
  "10399": "“Tôi uống thuốc đều, huyết áp đo sáng nay 128/82.”",
  "10362": "“Cân nặng vẫn vậy, không thấy khó thở gì cả.”",
  "10510": "“…”  (không bắt máy)",
  "10523": "“Vết mổ khô rồi, tôi đi lại nhẹ nhàng được.”",
};

function getPatient(mrn) { return PATIENTS.find(p => p.mrn === mrn); }

/* default user-editable settings (stored locally, clinician preference) */
const DEFAULT_SETTINGS = {
  name: "BS. Vũ Văn Côi", role: "Bác sĩ điều trị", dept: "Khoa Tim mạch",
  theme: "light", fontScale: "md", uiScale: "md", highContrast: false, reduceMotion: false,
};
