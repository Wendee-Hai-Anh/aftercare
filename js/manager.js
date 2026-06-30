/* =========================================================================
   AfterCare · manager.js — AI Follow-up Manager (5 tools, hash-routed)
   ========================================================================= */

const clone = o => JSON.parse(JSON.stringify(o));
const MS = {
  week: clone(AI_CALENDAR.week),
  workingHours: clone(AI_CALENDAR.workingHours),
  retry: clone(AI_CALENDAR.retry),
  blackout: clone(AI_CALENDAR.blackout),
  upcoming: clone(AI_CALENDAR.upcoming),
  templates: clone(TEMPLATES),
  rules: clone(ESCALATION_RULES),
  notifications: clone(NOTIFICATIONS),
  calView: "week",
  selTpl: TEMPLATES[0].id,
  sched: { scope: "Theo bệnh", target: CONDITIONS[0], interval: 7, start: "2026-06-17", count: 5 },
  _drag: null,
};
const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const TABS = [
  { id: "calendar",      label: "Lịch gọi AI",      render: renderCalendar },
  { id: "templates",     label: "Bộ câu hỏi",       render: renderTemplates },
  { id: "protocols",     label: "Giao thức & cảnh báo", render: renderRules },
  { id: "performance",   label: "Hiệu suất AI",     render: renderPerformance },
  { id: "notifications", label: "Thông báo",        render: renderNotifications },
];

function activeTab() {
  const h = (location.hash || "#calendar").slice(1);
  return TABS.find(t => t.id === h) ? h : "calendar";
}
function renderTabs() {
  const cur = activeTab();
  const failed = MS.notifications.find(g => g.group.includes("thất bại"));
  const fc = failed ? failed.items.length : 0;
  $("#mtabs").innerHTML = TABS.map(t => `
    <button class="mtab ${t.id === cur ? "active" : ""}" data-tab="${t.id}">${esc(t.label)}
      ${t.id === "notifications" && fc ? `<span class="badge red" style="padding:1px 7px">${fc}</span>` : ""}</button>`).join("");
  $all("#mtabs .mtab").forEach(b => b.addEventListener("click", () => { location.hash = b.dataset.tab; }));
}
function route() { renderTabs(); TABS.find(t => t.id === activeTab()).render(); }

/* =========================================================================
   1) AI Call Calendar
   ========================================================================= */
function renderCalendar() {
  const v = $("#managerView");
  v.innerHTML = `
    <div class="mgrid">
      <div class="mcard">
        <div class="cal-toolbar">
          <div class="segmented" id="calSeg">
            <button data-v="day" class="${MS.calView === "day" ? "active" : ""}">Ngày</button>
            <button data-v="week" class="${MS.calView === "week" ? "active" : ""}">Tuần</button>
            <button data-v="month" class="${MS.calView === "month" ? "active" : ""}">Tháng</button>
          </div>
          <span class="grow"></span>
          <span class="muted-note">Tuần 15–21/06/2026 · kéo–thả để đổi ngày gọi</span>
        </div>
        <div id="calBody"></div>
      </div>
      <div>
        <div class="mcard" style="margin-bottom:16px">
          <h3>Cuộc gọi sắp tới</h3>
          ${MS.upcoming.map(u => `<div class="upcoming-item"><div><strong>${esc(u.name)}</strong>
            <div class="when">${esc(u.when)} · ${esc(u.group)}</div></div></div>`).join("")}
        </div>
        <div class="mcard" id="schedBuilder"></div>
      </div>
    </div>
    <div class="mgrid" style="margin-top:20px">
      <div class="mcard" id="hoursCfg"></div>
      <div class="mcard" id="blackoutCfg"></div>
    </div>`;
  $all("#calSeg button").forEach(b => b.addEventListener("click", () => { MS.calView = b.dataset.v; renderCalendar(); }));
  renderCalBody();
  renderSchedBuilder();
  renderHoursCfg();
  renderBlackoutCfg();
}

function callChip(c, dayKey, idx) {
  return `<div class="cal-chip ${c.status === "failed" ? "failed" : ""}" draggable="true"
       data-day="${dayKey}" data-idx="${idx}">
    <span class="t">${esc(c.time)}</span><span class="n">${esc(c.name)}</span><span class="g">${esc(c.group)}</span></div>`;
}

function renderCalBody() {
  const body = $("#calBody");
  if (MS.calView === "week") {
    body.innerHTML = `<div class="cal-week">${DAYS.map(d => `
      <div class="cal-col" data-day="${d}"><h4>${d}</h4>
        ${(MS.week[d] || []).map((c, i) => callChip(c, d, i)).join("")}</div>`).join("")}</div>`;
    wireDnD();
  } else if (MS.calView === "day") {
    const list = (MS.week["T2"] || []).concat(MS.week["T3"] || []); // demo "today"
    const today = AI_CALLS_TODAY;
    body.innerHTML = `<div class="day-list">${today.map(c => `
      <div class="day-item"><span class="time">${esc(c.time)}</span>
        <div style="flex:1"><strong>${esc(c.name)}</strong> <span class="muted-note">· ${esc(c.group)}</span></div>
        ${callPill(c.status)}
        <button class="btn btn-sm" onclick="openCase('${c.mrn}')">Mở ca</button></div>`).join("")}</div>`;
  } else {
    body.innerHTML = renderMonth();
  }
}

function renderMonth() {
  // June 2026: 1st = Monday, 30 days
  const counts = {}; DAYS.forEach(d => {}); 
  const weekCount = Object.values(MS.week).reduce((n, a) => n + a.length, 0);
  const map = { 16: { c: 3, f: 1 }, 17: { c: 2, f: 1 }, 18: { c: 1, f: 0, black: true }, 19: { c: 1 }, 20: { c: 1 }, 22: { black: true } };
  let cells = "";
  DAYS.forEach(d => cells += `<div class="dow">${d}</div>`);
  for (let day = 1; day <= 30; day++) {
    const m = map[day] || {};
    cells += `<div class="cal-cell ${day === 16 ? "today" : ""} ${m.black ? "black" : ""}">
      <span class="dn">${day}</span>
      ${m.c ? `<div><span class="cnt">${m.c}</span></div>` : ""}
      ${m.f ? `<div style="margin-top:4px"><span class="cnt fail">${m.f} lỗi</span></div>` : ""}
      ${m.black && !m.c ? `<div class="muted-note" style="margin-top:6px">Nghỉ</div>` : ""}</div>`;
  }
  return `<div class="cal-month">${cells}</div>
    <p class="muted-note" style="margin-top:10px">Tháng 6/2026 · ${weekCount} cuộc gọi trong tuần hiện tại · ngày gạch chéo là ngày nghỉ/bảo trì.</p>`;
}

function wireDnD() {
  $all(".cal-chip").forEach(chip => {
    chip.addEventListener("dragstart", () => { MS._drag = { day: chip.dataset.day, idx: +chip.dataset.idx }; chip.classList.add("dragging"); });
    chip.addEventListener("dragend", () => chip.classList.remove("dragging"));
  });
  $all(".cal-col").forEach(col => {
    col.addEventListener("dragover", e => { e.preventDefault(); col.classList.add("drop"); });
    col.addEventListener("dragleave", () => col.classList.remove("drop"));
    col.addEventListener("drop", e => {
      e.preventDefault(); col.classList.remove("drop");
      if (!MS._drag) return;
      const to = col.dataset.day, from = MS._drag.day;
      if (to === from) return;
      const item = MS.week[from].splice(MS._drag.idx, 1)[0];
      MS.week[to].push(item);
      MS.week[to].sort((a, b) => a.time.localeCompare(b.time));
      MS._drag = null;
      Metrics.track("ai_reschedule", "Đổi ngày gọi: " + item.name);
      toast(`Đã chuyển cuộc gọi của ${item.name} sang ${to}.`);
      renderCalBody();
    });
  });
}

function renderSchedBuilder() {
  const s = MS.sched;
  $("#schedBuilder").innerHTML = `
    <h3>Tạo lịch gọi</h3>
    <div class="cfg-row"><span class="lbl">Phạm vi</span>
      <select class="select" id="sbScope">${["Bệnh nhân cụ thể", "Theo bệnh", "Theo giao thức"].map(o => `<option ${o === s.scope ? "selected" : ""}>${o}</option>`).join("")}</select></div>
    <div class="cfg-row"><span class="lbl" id="sbTargetLbl">Đối tượng</span>
      <select class="select" id="sbTarget"></select></div>
    <div class="cfg-row"><span class="lbl">Khoảng lặp</span>
      <select class="select" id="sbInterval">
        <option value="3">Mỗi 3 ngày</option><option value="7" selected>Mỗi 7 ngày</option>
        <option value="14">Mỗi 14 ngày</option><option value="custom">Tùy chỉnh…</option></select>
      <input class="input" id="sbCustom" type="number" min="1" value="${s.interval}" style="width:70px;display:none"> </div>
    <div class="cfg-row"><span class="lbl">Bắt đầu</span><input class="input" id="sbStart" type="date" value="${s.start}"></div>
    <div class="cfg-row"><span class="lbl">Số lần gọi</span><input class="input" id="sbCount" type="number" min="1" max="12" value="${s.count}" style="width:70px"></div>
    <button class="btn btn-leaf btn-sm" id="sbApply">Tính & lưu lịch</button>
    <div id="sbDates" class="computed-dates"></div>`;

  const fillTarget = () => {
    const scope = $("#sbScope").value;
    $("#sbTargetLbl").textContent = scope === "Bệnh nhân cụ thể" ? "Bệnh nhân" : scope === "Theo bệnh" ? "Nhóm bệnh" : "Giao thức";
    const opts = scope === "Bệnh nhân cụ thể" ? PATIENTS.map(p => `${p.name} (${p.mrn})`)
      : scope === "Theo bệnh" ? CONDITIONS : MS.templates.map(t => t.name);
    $("#sbTarget").innerHTML = opts.map(o => `<option>${esc(o)}</option>`).join("");
  };
  fillTarget();
  $("#sbScope").addEventListener("change", () => { fillTarget(); compute(); });
  $("#sbInterval").addEventListener("change", e => {
    $("#sbCustom").style.display = e.target.value === "custom" ? "inline-block" : "none"; compute();
  });
  ["sbTarget", "sbCustom", "sbStart", "sbCount"].forEach(id => $("#" + id).addEventListener("change", compute));
  $("#sbApply").addEventListener("click", () => { compute(); Metrics.track("ai_schedule", "Tạo lịch gọi AI"); toast("Đã lưu lịch gọi."); });
  compute();

  function compute() {
    const iv = $("#sbInterval").value === "custom" ? Math.max(1, +$("#sbCustom").value || 1) : +$("#sbInterval").value;
    const start = $("#sbStart").value, count = Math.max(1, Math.min(12, +$("#sbCount").value || 1));
    if (!start) { $("#sbDates").innerHTML = ""; return; }
    const base = new Date(start + "T00:00:00");
    let html = "";
    for (let k = 0; k < count; k++) {
      const d = new Date(base); d.setDate(d.getDate() + k * iv);
      html += `<span class="cd">${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}</span>`;
    }
    $("#sbDates").innerHTML = html;
  }
}

function renderHoursCfg() {
  const w = MS.workingHours;
  $("#hoursCfg").innerHTML = `
    <h3>Giờ làm việc & gọi lại</h3>
    <div class="cfg-row"><span class="lbl">Giờ gọi</span>
      <input class="input" id="whStart" type="time" value="${w.start}"> –
      <input class="input" id="whEnd" type="time" value="${w.end}"></div>
    <div class="cfg-row"><span class="lbl">Ngày gọi</span>
      <div class="daychips" id="whDays">${DAYS.map(d => `<span class="daychip ${w.days.includes(d) ? "on" : ""}" data-d="${d}">${d}</span>`).join("")}</div></div>
    <div class="cfg-row"><span class="lbl">Gọi lại sau</span>
      <input class="input" id="rtMin" type="number" value="${MS.retry.afterMin}" style="width:80px"> phút</div>
    <div class="cfg-row"><span class="lbl">Số lần gọi lại tối đa</span>
      <input class="input" id="rtMax" type="number" value="${MS.retry.maxAttempts}" style="width:80px"></div>
    <button class="btn btn-leaf btn-sm" id="whSave">Lưu cấu hình</button>`;
  $all("#whDays .daychip").forEach(c => c.addEventListener("click", () => {
    const d = c.dataset.d, i = w.days.indexOf(d);
    if (i >= 0) w.days.splice(i, 1); else w.days.push(d);
    c.classList.toggle("on");
  }));
  $("#whSave").addEventListener("click", () => {
    w.start = $("#whStart").value; w.end = $("#whEnd").value;
    MS.retry.afterMin = +$("#rtMin").value; MS.retry.maxAttempts = +$("#rtMax").value;
    Metrics.track("ai_config", "Lưu cấu hình giờ gọi"); toast("Đã lưu giờ làm việc và gọi lại.");
  });
}

function renderBlackoutCfg() {
  $("#blackoutCfg").innerHTML = `
    <h3>Ngày nghỉ / không gọi</h3>
    <div id="blackoutList">${MS.blackout.map((b, i) => `
      <div class="blackout-item"><span>${esc(b)}</span>
        <button class="btn btn-sm btn-danger" data-bo="${i}">Xóa</button></div>`).join("")}</div>
    <div class="cfg-row" style="margin-top:12px"><input class="input" id="boDate" type="date">
      <input class="input" id="boNote" placeholder="Lý do (nghỉ lễ, bảo trì…)"></div>
    <button class="btn btn-leaf btn-sm" id="boAdd">Thêm ngày nghỉ</button>`;
  $all("[data-bo]").forEach(b => b.addEventListener("click", () => {
    MS.blackout.splice(+b.dataset.bo, 1); renderBlackoutCfg(); toast("Đã xóa ngày nghỉ.");
  }));
  $("#boAdd").addEventListener("click", () => {
    const d = $("#boDate").value, n = $("#boNote").value.trim();
    if (!d) { toast("Chọn ngày trước đã."); return; }
    const [y, m, day] = d.split("-");
    MS.blackout.push(`${day}/${m}/${y}${n ? " (" + n + ")" : ""}`);
    renderBlackoutCfg(); toast("Đã thêm ngày nghỉ.");
  });
}

/* =========================================================================
   2) Question Template Manager
   ========================================================================= */
function renderTemplates() {
  $("#managerView").innerHTML = `
    <div class="mgrid wide">
      <div class="mcard">
        <div class="h-row"><h3>Bộ câu hỏi theo bệnh</h3></div>
        <div class="tpl-list" id="tplList"></div>
      </div>
      <div class="mcard" id="tplEditor"></div>
    </div>`;
  renderTplList(); renderTplEditor();
}
function renderTplList() {
  $("#tplList").innerHTML = MS.templates.map(t => `
    <div class="tpl-item ${t.id === MS.selTpl ? "active" : ""}" data-tpl="${t.id}">
      <div class="d">${esc(t.disease)}</div><div class="n">${esc(t.name)}</div>
      <div class="meta"><span class="mono">${t.version}</span> · ${t.questions.length} câu ·
        ${t.active ? `<span class="pill green" style="padding:1px 8px">Đang dùng</span>` : `<span class="pill muted" style="padding:1px 8px">Tắt</span>`}</div>
    </div>`).join("");
  $all("#tplList .tpl-item").forEach(el => el.addEventListener("click", () => { MS.selTpl = el.dataset.tpl; renderTemplates(); }));
}
function selTpl() { return MS.templates.find(t => t.id === MS.selTpl); }

function renderTplEditor() {
  const t = selTpl();
  $("#tplEditor").innerHTML = `
    <div class="h-row">
      <h3>${esc(t.name)}</h3>
      <span class="pill ${t.active ? "green" : "muted"}">${t.active ? "Đang dùng" : "Đã tắt"}</span>
      <span class="grow"></span>
      <label class="check" style="padding:0">Bật bộ câu hỏi
        <span class="toggle"><input type="checkbox" id="tplActive" ${t.active ? "checked" : ""}><span class="track"></span></span></label>
    </div>
    <div class="cfg-row"><span class="lbl">Gán cho bệnh nhân</span>
      <select class="select" id="tplAssign">
        <option ${t.assign.includes("Tự động") ? "selected" : ""}>Tự động theo chẩn đoán: ${esc(t.disease)}</option>
        <option ${t.assign === "Gán thủ công" ? "selected" : ""}>Gán thủ công</option></select>
      <button class="btn btn-sm" id="tplOverride">Gán riêng cho bệnh nhân…</button></div>

    <p class="muted-note" style="margin:6px 0 12px">Kéo thẻ để đổi thứ tự. Mỗi câu có thể bật/tắt, đặt bắt buộc/tùy chọn, hoặc thêm nhánh điều kiện.</p>
    <div id="qList"></div>
    <div class="cfg-row" style="margin-top:6px"><input class="input" id="qNew" placeholder="Thêm câu hỏi mới…" style="flex:1;min-width:200px">
      <button class="btn btn-leaf btn-sm" id="qAdd">Thêm câu hỏi</button></div>

    <div style="margin-top:18px"><h3 style="margin-bottom:10px">Lịch sử phiên bản</h3>
      ${t.history.map(h => `<div class="history-row"><span class="v">${esc(h.v)}</span>
        <span class="x">${esc(h.when)} · ${esc(h.by)} — ${esc(h.note)}</span></div>`).join("")}</div>`;

  $("#tplActive").addEventListener("change", e => { t.active = e.target.checked; renderTplList(); renderTplEditor(); toast(t.active ? "Đã bật bộ câu hỏi." : "Đã tắt bộ câu hỏi."); });
  $("#tplAssign").addEventListener("change", e => { t.assign = e.target.value; toast("Đã đổi cách gán."); });
  $("#tplOverride").addEventListener("click", () => openOverride(t));
  $("#qAdd").addEventListener("click", addQuestion);
  $("#qNew").addEventListener("keydown", e => { if (e.key === "Enter") addQuestion(); });
  renderQList();
}

function renderQList() {
  const t = selTpl();
  $("#qList").innerHTML = t.questions.map((q, i) => `
    <div class="q-row ${q.disabled ? "off" : ""}" draggable="true" data-i="${i}">
      <span class="q-handle" title="Kéo để đổi thứ tự">⠿</span>
      <div class="q-main">
        <div class="q-text">${esc(q.text)}</div>
        <div class="q-flags">
          <span class="req-pill ${q.required ? "req" : "opt"}" data-req="${i}">${q.required ? "Bắt buộc" : "Tùy chọn"}</span>
          <button class="btn tiny" data-branch="${i}">＋ nhánh điều kiện</button>
        </div>
        ${q.branch ? `<div class="q-branch">↳ ${esc(q.branch.when)}: <b>${esc(q.branch.ask)}</b></div>` : ""}
      </div>
      <div class="q-actions">
        <label class="toggle" title="Bật/tắt câu hỏi"><input type="checkbox" ${q.disabled ? "" : "checked"} data-on="${i}"><span class="track"></span></label>
        <button class="btn tiny btn-danger" data-del="${i}">Xóa</button>
      </div>
    </div>`).join("");

  $all("#qList [data-req]").forEach(el => el.addEventListener("click", () => { t.questions[+el.dataset.req].required = !t.questions[+el.dataset.req].required; renderQList(); }));
  $all("#qList [data-on]").forEach(el => el.addEventListener("change", () => { t.questions[+el.dataset.on].disabled = !el.checked; renderQList(); }));
  $all("#qList [data-del]").forEach(el => el.addEventListener("click", () => { t.questions.splice(+el.dataset.del, 1); renderQList(); toast("Đã xóa câu hỏi."); }));
  $all("#qList [data-branch]").forEach(el => el.addEventListener("click", () => openBranch(t, +el.dataset.branch)));
  wireQDnD();
}

function wireQDnD() {
  const t = selTpl();
  let src = null;
  $all("#qList .q-row").forEach(row => {
    row.addEventListener("dragstart", () => { src = +row.dataset.i; row.classList.add("dragging"); });
    row.addEventListener("dragend", () => row.classList.remove("dragging"));
    row.addEventListener("dragover", e => e.preventDefault());
    row.addEventListener("drop", e => {
      e.preventDefault();
      const dst = +row.dataset.i;
      if (src === null || src === dst) return;
      const item = t.questions.splice(src, 1)[0];
      t.questions.splice(dst, 0, item);
      src = null; renderQList(); Metrics.track("tpl_reorder", "Sắp xếp lại câu hỏi");
    });
  });
}

function addQuestion() {
  const inp = $("#qNew"), txt = inp.value.trim();
  if (!txt) { toast("Nhập nội dung câu hỏi."); return; }
  selTpl().questions.push({ text: txt, required: false });
  inp.value = ""; renderQList(); Metrics.track("tpl_add_q", "Thêm câu hỏi"); toast("Đã thêm câu hỏi.");
}
function openBranch(t, i) {
  openDrawer("Thêm nhánh điều kiện", `
    <p class="muted-note">Câu hỏi: <b>${esc(t.questions[i].text)}</b></p>
    ${fieldInput("Điều kiện (nếu…)", "when", "text", t.questions[i].branch ? t.questions[i].branch.when : "Nếu bệnh nhân trả lời Có")}
    ${fieldInput("Hỏi tiếp", "ask", "text", t.questions[i].branch ? t.questions[i].branch.ask : "")}
    <div class="drawer-actions"><button class="btn btn-leaf btn-block" id="brSave">Lưu nhánh</button></div>`,
    box => $("#brSave", box).addEventListener("click", () => {
      const when = $('[name=when]', box).value.trim(), ask = $('[name=ask]', box).value.trim();
      if (!ask) { toast("Nhập câu hỏi tiếp theo."); return; }
      t.questions[i].branch = { when, ask }; closeDrawer(); renderQList(); toast("Đã thêm nhánh điều kiện.");
    }));
}
function openOverride(t) {
  openDrawer("Gán riêng cho bệnh nhân", `
    ${fieldSelect("Bệnh nhân", "p", PATIENTS.map(p => `${p.name} (${p.mrn})`), "")}
    <p class="muted-note">Bệnh nhân này sẽ dùng bộ câu hỏi “${esc(t.name)}” thay cho bộ mặc định theo bệnh.</p>
    <div class="drawer-actions"><button class="btn btn-leaf btn-block" id="ovSave">Gán riêng</button></div>`,
    box => $("#ovSave", box).addEventListener("click", () => { closeDrawer(); toast("Đã gán bộ câu hỏi riêng cho bệnh nhân."); }));
}

/* =========================================================================
   3) Protocol & Escalation rules
   ========================================================================= */
function renderRules() {
  $("#managerView").innerHTML = `
    <div class="mcard">
      <div class="h-row"><h3>Giao thức & quy tắc cảnh báo</h3><span class="grow"></span>
        <button class="btn btn-leaf btn-sm" id="ruleAdd">＋ Thêm giao thức</button></div>
      <p class="muted-note" style="margin-bottom:14px">Mỗi quy tắc: khi điều kiện đúng → gắn mức ưu tiên, báo cho ai, có tự đặt lịch khám và có cần bác sĩ duyệt không.</p>
      <div id="ruleList"></div>
    </div>`;
  $("#ruleAdd").addEventListener("click", () => openRule(null));
  renderRuleList();
}
function renderRuleList() {
  $("#ruleList").innerHTML = MS.rules.map((r, i) => `
    <div class="rule-card">
      <div class="r-head">${riskBadge(r.risk)}<span class="nm">${esc(r.name)}</span><span class="grow"></span>
        <label class="check" style="padding:0">Bật
          <span class="toggle"><input type="checkbox" ${r.active ? "checked" : ""} data-ron="${i}"><span class="track"></span></span></label></div>
      <div class="rule-flow">
        <span class="node cond">Khi: ${esc(r.when)}</span><span class="arrow">→</span>
        <span class="node out">Mức: ${esc(RISK[r.risk].label)}</span>
        ${r.autoAppt.on ? `<span class="arrow">→</span><span class="node out">Tự đặt khám ${esc(r.autoAppt.specialty)} trong ${esc(r.autoAppt.within)}</span>` : ""}
      </div>
      <div class="rule-meta">
        <span>Báo cho: <b>${esc(r.recipients.join(", "))}</b></span>
        <span>Cần bác sĩ duyệt: <b>${r.approval ? "Có" : "Không"}</b></span>
      </div>
      <div class="rule-actions">
        <button class="btn btn-sm" data-redit="${i}">Sửa</button>
        <button class="btn btn-sm" data-rdup="${i}">Nhân bản</button>
        <button class="btn btn-sm btn-danger" data-rdel="${i}">Xóa</button>
      </div>
    </div>`).join("");
  $all("[data-ron]").forEach(el => el.addEventListener("change", () => { MS.rules[+el.dataset.ron].active = el.checked; toast(el.checked ? "Đã bật quy tắc." : "Đã tắt quy tắc."); }));
  $all("[data-redit]").forEach(el => el.addEventListener("click", () => openRule(+el.dataset.redit)));
  $all("[data-rdup]").forEach(el => el.addEventListener("click", () => {
    const c = clone(MS.rules[+el.dataset.rdup]); c.name += " (bản sao)"; c.id = "r" + Date.now();
    MS.rules.push(c); renderRuleList(); toast("Đã nhân bản quy tắc.");
  }));
  $all("[data-rdel]").forEach(el => el.addEventListener("click", () => { MS.rules.splice(+el.dataset.rdel, 1); renderRuleList(); toast("Đã xóa quy tắc."); }));
}
function openRule(idx) {
  const editing = idx !== null;
  const r = editing ? MS.rules[idx] : { name: "", when: "", risk: "amber", recipients: ["Bác sĩ phụ trách"], autoAppt: { on: false, specialty: "Tim mạch", within: "24 giờ" }, approval: false, active: true };
  const recAll = ["Bác sĩ phụ trách", "Điều dưỡng phụ trách", "Điều dưỡng trực", "Người nhà"];
  openDrawer(editing ? "Sửa giao thức" : "Thêm giao thức", `
    ${fieldInput("Tên giao thức", "name", "text", r.name)}
    <label class="f"><span>Điều kiện kích hoạt (khi…)</span>
      <textarea class="input" name="when" rows="2" placeholder="VD: Khó thở khi nằm = Có VÀ Phù chi = Tăng">${esc(r.when)}</textarea></label>
    ${fieldSelect("Mức ưu tiên gắn cờ", "risk", ["Nguy cơ cao", "Cần theo dõi", "Ổn định"], RISK[r.risk].label)}
    <div class="f"><span>Báo cho ai</span>
      ${recAll.map(x => `<label class="check"><input type="checkbox" name="rec" value="${esc(x)}" ${r.recipients.includes(x) ? "checked" : ""}> ${esc(x)}</label>`).join("")}</div>
    <label class="check"><input type="checkbox" name="autoOn" ${r.autoAppt.on ? "checked" : ""}> Tự động đặt lịch khám</label>
    ${fieldSelect("Chuyên khoa khám", "spec", SPECIALTIES, r.autoAppt.specialty)}
    ${fieldSelect("Trong vòng", "within", ["24 giờ", "48 giờ", "72 giờ", "1 tuần"], r.autoAppt.within || "24 giờ")}
    <label class="check"><input type="checkbox" name="approval" ${r.approval ? "checked" : ""}> Cần bác sĩ duyệt trước khi thực hiện</label>
    <div class="drawer-actions"><button class="btn btn-leaf btn-block" id="ruleSave">${editing ? "Lưu thay đổi" : "Thêm giao thức"}</button></div>`,
    box => $("#ruleSave", box).addEventListener("click", () => {
      const riskMap = { "Nguy cơ cao": "red", "Cần theo dõi": "amber", "Ổn định": "green" };
      const data = {
        id: r.id || ("r" + Date.now()), active: r.active !== false,
        name: $('[name=name]', box).value.trim() || "Giao thức mới",
        when: $('[name=when]', box).value.trim() || "—",
        risk: riskMap[$('[name=risk]', box).value],
        recipients: $all('[name=rec]:checked', box).map(c => c.value),
        autoAppt: { on: $('[name=autoOn]', box).checked, specialty: $('[name=spec]', box).value, within: $('[name=within]', box).value },
        approval: $('[name=approval]', box).checked,
      };
      if (editing) MS.rules[idx] = data; else MS.rules.push(data);
      closeDrawer(); renderRuleList(); toast(editing ? "Đã lưu giao thức." : "Đã thêm giao thức.");
    }));
}

/* =========================================================================
   4) AI Performance Dashboard
   ========================================================================= */
function renderPerformance() {
  const P = AI_PERFORMANCE;
  const maxDay = Math.max.apply(null, P.daily.map(d => d.done + d.fail));
  const m = Metrics.read();
  const interactions = Object.values(m.counts).reduce((n, v) => n + v, 0);
  $("#managerView").innerHTML = `
    <div class="perf-stats">
      ${P.cards.map(c => `<div class="perf-stat ${c.tone}"><div class="v">${esc(c.value)}</div><div class="l">${esc(c.label)}</div></div>`).join("")}
    </div>
    <div class="mgrid">
      <div class="mcard">
        <h3>Cuộc gọi theo ngày (${esc(P.range)})</h3>
        <div class="daybars">${P.daily.map(d => {
          const dh = Math.round(d.done / maxDay * 140), fh = Math.round(d.fail / maxDay * 140);
          return `<div class="col"><div class="stack" style="height:${dh + fh}px">
            <span class="done" style="height:${dh}px"></span><span class="fail" style="height:${fh}px"></span></div>
            <span class="dl">${d.d}</span></div>`;
        }).join("")}</div>
        <p class="muted-note" style="margin-top:10px"><span style="color:var(--leaf-deep)">■</span> Hoàn thành &nbsp; <span style="color:var(--red)">■</span> Thất bại</p>
      </div>
      <div class="mcard">
        <h3>Độ tin cậy của trợ lý AI</h3>
        ${P.confidence.map(c => `<div class="bar-item"><div class="row"><span>${esc(c.band)}</span><b>${c.pct}%</b></div>
          <div class="track"><div class="fill" style="width:${c.pct}%;background:var(--${c.tone === "green" ? "green" : c.tone === "amber" ? "amber" : "red"})"></div></div></div>`).join("")}
        <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--line-soft)">
          <h3>Tương tác trong hệ thống</h3>
          <p class="muted-note">Ghi nhận cục bộ để theo dõi cách sử dụng — <b>${interactions}</b> thao tác.</p>
        </div>
      </div>
    </div>`;
}

/* =========================================================================
   5) Notification Center
   ========================================================================= */
function renderNotifications() {
  $("#managerView").innerHTML = `<div class="mcard"><div class="h-row"><h3>Trung tâm thông báo</h3></div><div id="notifList"></div></div>`;
  renderNotifList();
}
function renderNotifList() {
  const el = $("#notifList");
  const total = MS.notifications.reduce((n, g) => n + g.items.length, 0);
  if (!total) { el.innerHTML = `<div class="empty">Không có thông báo nào.</div>`; return; }
  el.innerHTML = MS.notifications.filter(g => g.items.length).map((g, gi) => `
    <div class="notif-group">
      <div class="g-head"><span class="dot ${g.tone}"></span><h4>${esc(g.group)}</h4>
        <span class="badge ${g.tone === "red" ? "red" : g.tone === "amber" ? "amber" : "green"}" style="padding:1px 8px">${g.items.length}</span></div>
      ${g.items.map((it, ii) => `<div class="notif-item">
        <span class="grow">${esc(it.text)}</span>
        ${it.action ? `<button class="btn btn-sm" data-na="${gi}:${ii}">${esc(it.action)}</button>` : ""}
        <button class="btn btn-sm btn-danger" data-nd="${gi}:${ii}">Bỏ qua</button></div>`).join("")}
    </div>`).join("");

  $all("[data-na]").forEach(b => b.addEventListener("click", () => {
    const [gi, ii] = b.dataset.na.split(":").map(Number);
    const it = MS.notifications[gi].items[ii];
    if (it.action === "Xem lịch") location.href = "appointments.html";
    else if (it.mrn) openCase(it.mrn);
  }));
  $all("[data-nd]").forEach(b => b.addEventListener("click", () => {
    const [gi, ii] = b.dataset.nd.split(":").map(Number);
    MS.notifications[gi].items.splice(ii, 1); renderNotifList(); renderTabs(); toast("Đã bỏ qua thông báo.");
  }));
}

/* ---- boot ------------------------------------------------------------- */
window.addEventListener("hashchange", route);
document.addEventListener("DOMContentLoaded", route);
