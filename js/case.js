/* =========================================================================
   AfterCare · case.js — rich case view + expanded doctor actions
   ========================================================================= */

function caseId() { return new URLSearchParams(location.search).get("id") || "10472"; }

/* merge roster + deep case data + sensible defaults */
function buildCase(mrn) {
  const p = getPatient(mrn) || getPatient("10472");
  const deep = CASES[mrn] || {};
  return {
    p,
    matchedProtocol: deep.matchedProtocol || {
      code: `${p.group} · ${RISK[p.risk].label}`,
      criteria: p.reason,
      action: p.risk === "red" ? "Bác sĩ liên hệ trong vòng 1 giờ" : "Theo dõi và rà soát trong 24 giờ",
    },
    escalationReason: deep.escalationReason || (p.risk === "red"
      ? "Trợ lý phát hiện dấu hiệu vượt ngưỡng an toàn và đã nâng mức ưu tiên, thông báo bác sĩ."
      : ""),
    slots: deep.slots || [{ label: "Tổng kết", tone: p.risk === "green" ? "green" : "amber", value: p.reason }],
    trends: deep.trends || [],
    previousCalls: deep.previousCalls || [
      { date: p.lastContact, day: p.day, duration: "2:30", outcome: RISK[p.risk].label,
        tone: p.risk, note: p.summary },
    ],
    summary: deep.summary || p.summary,
    transcript: deep.transcript || [
      { who: "Trợ lý", text: "Chào bác, dạo này sức khỏe của bác thế nào ạ?" },
      { who: "Bệnh nhân", text: (QUOTES[mrn] || "").replace(/[“”]/g, "") || "Bác thấy bình thường." },
    ],
    family: deep.family || (PHONES[mrn] ? PHONES[mrn].family : "—"),
    protocolCycle: deep.protocolCycle || `${p.group} · gọi ngày 1, 3, 7, 14, 30`,
  };
}

let C;

function renderTop() {
  const p = C.p;
  $("#caseTop").innerHTML = `
    <a class="case-back" href="patients.html" aria-label="Quay lại">&#8592;</a>
    <div>
      <div class="crumb">Bệnh nhân &nbsp;&rsaquo;&nbsp; Ca #${esc(p.mrn)}</div>
      <h1>Chi tiết ca · ${esc(p.name)}</h1>
    </div>
    <span class="grow"></span>
    <button class="btn" type="button" onclick="location.href='call.html?id=${esc(p.mrn)}'">Gọi bệnh nhân</button>
    <button class="btn btn-dark" type="button" onclick="actClose()">Đóng ca</button>`;
}

function spark(series, flagUp) {
  const max = Math.max.apply(null, series), min = Math.min.apply(null, series);
  const range = (max - min) || 1;
  const bars = series.map(v => `<i style="height:${8 + Math.round((v - min) / range * 26)}px"></i>`).join("");
  const dir = flagUp ? "up" : "down";
  return `<span class="spark ${flagUp ? "up" : "down"}">${bars}</span>`;
}

function renderMain() {
  const p = C.p;
  const adhTone = p.adherence >= 85 ? "green" : p.adherence >= 60 ? "amber" : "red";
  const adhColor = adhTone === "green" ? "var(--green)" : adhTone === "amber" ? "var(--amber)" : "var(--red)";

  const escalationHtml = C.escalationReason ? `
    <section class="callout red">
      <div><div class="ttl">Vì sao được nâng cảnh báo</div>
        <p>${esc(C.escalationReason)}</p></div>
    </section>` : "";

  const trendsHtml = C.trends.length ? `
    <section class="card sec">
      <span class="panel-title">Diễn biến gần đây</span>
      ${C.trends.map(t => {
        const now = t.series[t.series.length - 1], prev = t.series[t.series.length - 2];
        const arrow = now > prev ? "▲" : now < prev ? "▼" : "▬";
        const dirColor = t.flagUp ? "var(--red-ink)" : "var(--green-ink)";
        return `<div class="trend"><span class="t-label">${esc(t.label)}</span>
          ${spark(t.series, t.flagUp)}
          <span><span class="t-now">${now}</span> <span class="t-dir" style="color:${dirColor}">${arrow}</span></span></div>`;
      }).join("")}
    </section>` : "";

  $("#caseMain").innerHTML = `
    <section class="card cid">
      <div class="cid-head">
        <div class="avatar">${esc(avatarInitials(p.name))}</div>
        <div><h2>${esc(p.name)}</h2><div class="who">${esc(p.sex)} ${p.age} tuổi · Mã HS ${esc(p.mrn)}</div></div>
        <span class="grow"></span>${riskBadge(p.risk)}
      </div>
      <div class="cid-tags">
        <span class="pill info">Độ tin cậy AI: ${p.aiConfidence ? p.aiConfidence + "%" : "—"}</span>
        <span class="pill muted">Giao thức: ${esc(C.matchedProtocol.code)}</span>
        <span class="pill ${p.nextCall.status === "failed" ? "red" : "muted"}">Gọi kế tiếp: ${p.nextCall.status === "none" ? "chưa lên lịch" : esc(p.nextCall.date + " " + p.nextCall.time)}</span>
      </div>
      <dl class="facts">
        <dt>Chẩn đoán</dt><dd>${esc(p.diagnosis)}</dd>
        <dt>Xuất viện</dt><dd>${esc(p.dischargeDate)} (ngày theo dõi: ${p.day})</dd>
        <dt>Bác sĩ phụ trách</dt><dd>${esc(p.doctor)}</dd>
        <dt>Giao thức gọi</dt><dd>${esc(C.protocolCycle)}</dd>
        <dt>Người nhà</dt><dd>${esc(C.family)}</dd>
      </dl>
    </section>

    ${escalationHtml}

    <section class="card sec">
      <span class="panel-title">Giao thức khớp & hướng xử lý</span>
      <div class="protocol-box">
        <div class="row"><b>Giao thức</b><span>${esc(C.matchedProtocol.code)}</span></div>
        <div class="row"><b>Tiêu chí khớp</b><span>${esc(C.matchedProtocol.criteria)}</span></div>
        <div class="row"><b>Cần làm</b><span>${esc(C.matchedProtocol.action)}</span></div>
      </div>
    </section>

    <section class="card sec">
      <span class="panel-title">Thông tin thu thập trong cuộc gọi</span>
      ${C.slots.map(s => `<div class="slot-row"><span class="label">${esc(s.label)}</span>
        <span class="value ${s.tone}">${esc(s.value)}</span></div>`).join("")}
    </section>

    <section class="card sec">
      <span class="panel-title">Tuân thủ thuốc</span>
      <div class="adh"><div class="bar"><i style="width:${p.adherence}%;background:${adhColor}"></i></div>
        <span class="pct" style="color:${adhColor}">${p.adherence}%</span></div>
      <p style="margin:8px 0 0;color:var(--muted);font-size:13px">
        ${p.adherence >= 85 ? "Tuân thủ tốt." : p.adherence >= 60 ? "Tuân thủ chưa đều — cần nhắc lại." : "Tuân thủ kém — ưu tiên rà soát thuốc."}</p>
    </section>

    ${trendsHtml}

    <section class="card sec">
      <span class="panel-title">Các cuộc gọi trước</span>
      ${C.previousCalls.map(c => `
        <div class="pcall">
          <span class="when"><b>${esc(c.date)}</b><span class="mono">ngày ${c.day}</span></span>
          <span><span class="badge ${c.tone}">${esc(c.outcome)}</span><div class="note" style="margin-top:5px">${esc(c.note)}</div></span>
          <span class="dur">⏱ ${esc(c.duration)}</span>
        </div>`).join("")}
    </section>

    <section class="card sec">
      <span class="panel-title">Tóm tắt cuộc gọi &amp; bản ghi</span>
      <div class="player"><button class="play" type="button" onclick="toast('Trình phát là mô phỏng.')">&#9654;</button>
        <div class="pbar"></div><span class="time">01:12 / 03:24</span></div>
      <div class="summary-block"><h4>Bản tóm tắt</h4><p>${esc(C.summary)}</p></div>
      <span class="panel-title" style="display:block;margin:6px 0 8px">Trích nội dung cuộc gọi</span>
      <div class="transcript">${C.transcript.map(t => {
        const ai = /trợ lý/i.test(t.who);
        return `<div class="turn ${ai ? "ai" : "patient"}"><div class="speaker">${esc(t.who)}</div><p>${esc(t.text)}</p></div>`;
      }).join("")}</div>
    </section>`;
}

function renderSide() {
  const actions = [
    { ic: "☎", label: "Gọi lại bệnh nhân", fn: "actManualCall()", primary: true },
    { ic: "🤖", label: "Lên lịch gọi AI", fn: "actScheduleAI()" },
    { ic: "👤", label: "Gán điều dưỡng", fn: "actAssign()" },
    { ic: "📅", label: "Đặt lịch khám lại", fn: "actAppointment()" },
    { ic: "⇪", label: "Chuyển chuyên khoa", fn: "actEscalate()" },
    { ic: "✓", label: "Bỏ qua cảnh báo", fn: "actDismiss()" },
    { ic: "⏻", label: "Đóng ca & phân loại lại", fn: "actClose()" },
  ];
  const tl = C.previousCalls.map(c => `
    <div class="tl-row"><div class="d"><span class="badge ${c.tone}" style="padding:1px 8px">${esc(c.outcome)}</span> ${esc(c.date)} · ngày ${c.day}</div>
      <div class="x">${esc(c.note)}</div></div>`).join("");

  $("#caseSide").innerHTML = `
    <section class="card actions-card">
      <span class="panel-title">Chỉ thị của bác sĩ</span>
      ${actions.map(a => `<button class="action-btn ${a.primary ? "primary" : ""}" type="button" onclick="${a.fn}">
        <span class="ic">${a.ic}</span>${esc(a.label)}</button>`).join("")}
      <p class="note">Sau khi bác sĩ chỉ thị, trợ lý sẽ chuyển tiếp tới bệnh nhân và người nhà.</p>
    </section>
    <section class="card timeline-card">
      <span class="panel-title">Dòng thời gian theo dõi</span>
      ${tl}
    </section>`;
}

/* ---- doctor actions (drawer-driven) ---------------------------------- */
function actManualCall() { location.href = "call.html?id=" + C.p.mrn; }

function actScheduleAI() {
  openDrawer("Lên lịch gọi AI", `
    ${fieldInput("Ngày gọi", "date", "date", "2026-06-18")}
    ${fieldInput("Giờ gọi", "time", "time", "09:00")}
    ${fieldSelect("Bộ câu hỏi", "tpl", TEMPLATES.map(t => t.name), TEMPLATES.find(t => t.disease === C.p.group)?.name || TEMPLATES[0].name)}
    ${fieldSelect("Lặp lại", "rep", ["Một lần", "Mỗi 3 ngày", "Mỗi 7 ngày", "Mỗi 14 ngày"], "Mỗi 7 ngày")}
    <div class="drawer-actions"><button class="btn btn-leaf btn-block" onclick="saveAct('Đã lên lịch gọi Aho')">Lưu lịch gọi</button></div>`);
}
function actAssign() {
  openDrawer("Gán điều dưỡng theo dõi", `
    ${fieldSelect("Điều dưỡng", "staff", STAFF, STAFF[0])}
    ${fieldSelect("Mức ưu tiên", "prio", ["Bình thường", "Trong ngày", "Khẩn"], "Trong ngày")}
    <label class="f"><span>Ghi chú</span><textarea class="input" name="note" rows="3" placeholder="VD: gọi lại người nhà xác nhận triệu chứng"></textarea></label>
    <div class="drawer-actions"><button class="btn btn-leaf btn-block" onclick="saveAct('Đã gán điều dưỡng theo dõi')">Gán</button></div>`);
}
function actAppointment() {
  openDrawer("Đặt lịch khám lại", `
    ${fieldInput("Ngày khám", "date", "date", "2026-06-18")}
    ${fieldInput("Giờ", "time", "time", "10:00")}
    ${fieldSelect("Chuyên khoa", "spec", SPECIALTIES, "Tim mạch")}
    ${fieldInput("Ghi chú", "note", "text", "Tái khám theo dõi")}
    <div class="drawer-actions"><button class="btn btn-leaf btn-block" onclick="saveAct('Đã đặt lịch khám lại')">Đặt lịch</button></div>`);
}
function actEscalate() {
  openDrawer("Chuyển chuyên khoa", `
    ${fieldSelect("Chuyển đến", "spec", SPECIALTIES, "Tim mạch")}
    ${fieldSelect("Mức độ", "lvl", ["Hội chẩn", "Khám ưu tiên", "Cấp cứu"], "Khám ưu tiên")}
    <label class="f"><span>Lý do chuyển</span><textarea class="input" name="reason" rows="3">${esc(C.matchedProtocol.criteria)}</textarea></label>
    <div class="drawer-actions"><button class="btn btn-leaf btn-block" onclick="saveAct('Đã chuyển chuyên khoa')">Chuyển</button></div>`);
}
function actDismiss() {
  openDrawer("Bỏ qua cảnh báo", `
    <p style="margin:0;color:var(--muted);font-size:13.5px">Xác nhận triệu chứng đã được xử lý hoặc không cần can thiệp thêm.</p>
    ${fieldSelect("Lý do", "reason", ["Đã liên hệ và ổn", "Dương tính giả", "Người nhà đã xử lý", "Khác"], "Đã liên hệ và ổn")}
    <div class="drawer-actions"><button class="btn btn-danger btn-block" onclick="saveAct('Đã bỏ qua cảnh báo')">Bỏ qua cảnh báo</button></div>`);
}
function actClose() {
  openDrawer("Đóng ca & phân loại lại", `
    ${fieldSelect("Phân loại mới", "risk", ["Nguy cơ cao", "Cần theo dõi", "Ổn định"], RISK[C.p.risk].label)}
    ${fieldSelect("Bước tiếp theo", "next", ["Tiếp tục theo dõi tự động", "Kết thúc theo dõi", "Gia hạn theo dõi"], "Tiếp tục theo dõi tự động")}
    <label class="f"><span>Ghi chú đóng ca</span><textarea class="input" name="note" rows="3"></textarea></label>
    <div class="drawer-actions"><button class="btn btn-dark btn-block" onclick="saveAct('Đã đóng ca', true)">Đóng ca</button></div>`);
}
function saveAct(msg, leave) {
  Metrics.track("case_action", msg + " · " + C.p.name);
  closeDrawer(); toast(msg + ".");
  if (leave) setTimeout(() => location.href = "index.html", 900);
}

document.addEventListener("DOMContentLoaded", () => {
  C = buildCase(caseId());
  renderTop(); renderMain(); renderSide();
});
