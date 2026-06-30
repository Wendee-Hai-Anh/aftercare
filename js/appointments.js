/* =========================================================================
   AfterCare · appointments.js — calendar with CRUD, drag-drop, filters
   ========================================================================= */

/* demo week 15–21/06/2026 (T2..CN); June 1 2026 = Monday */
const WEEK_DATES = ["2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21"];
const DOW = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

let AS = {
  view: "week", filterDoctor: "", filterPatient: "", filterDisease: "", sel: "2026-06-16", _drag: null,
  list: [
    { id: "a1", mrn: "10472", date: "2026-06-16", time: "15:30", specialty: "Tim mạch", doctor: "BS. Vũ Văn Côi", note: "Ưu tiên sau cảnh báo nguy cơ cao" },
    { id: "a2", mrn: "10501", date: "2026-06-17", time: "09:00", specialty: "Ngoại chấn thương", doctor: "BS. Vũ Văn Côi", note: "Kiểm tra vết mổ, bài tập phục hồi" },
    { id: "a3", mrn: "10488", date: "2026-06-17", time: "11:00", specialty: "Hô hấp", doctor: "BS. Nguyễn Lan Anh", note: "Theo dõi sau đợt cấp COPD" },
    { id: "a4", mrn: "10455", date: "2026-06-18", time: "10:15", specialty: "Nội tiết", doctor: "BS. Đặng Quốc Huy", note: "Rà soát tuân thủ thuốc" },
    { id: "a5", mrn: "10523", date: "2026-06-19", time: "14:00", specialty: "Nội tổng quát", doctor: "BS. Đặng Quốc Huy", note: "Kiểm tra hậu phẫu ổ bụng" },
    { id: "a6", mrn: "10399", date: "2026-06-20", time: "08:30", specialty: "Nội tổng quát", doctor: "BS. Đặng Quốc Huy", note: "Tái khám tăng huyết áp" },
  ],
};

function specClass(s) {
  if (s.includes("Tim")) return "spec-tim";
  if (s.includes("Hô hấp")) return "spec-ho";
  if (s.includes("Nội")) return "spec-noi";
  if (s.includes("Ngoại")) return "spec-ngoai";
  return "";
}
function apName(mrn) { const p = getPatient(mrn); return p ? p.name : mrn; }
function apGroup(mrn) { const p = getPatient(mrn); return p ? p.group : ""; }
function fmtVN(iso) { const [y, m, d] = iso.split("-"); return `${d}/${m}`; }

function visible() {
  return AS.list.filter(a => {
    if (AS.filterDoctor && a.doctor !== AS.filterDoctor) return false;
    if (AS.filterPatient && a.mrn !== AS.filterPatient) return false;
    if (AS.filterDisease && apGroup(a.mrn) !== AS.filterDisease) return false;
    return true;
  });
}

function renderFilters() {
  const groups = Array.from(new Set(PATIENTS.map(p => p.group)));
  $("#apFilters").innerHTML = `
    <label class="f"><span>Bác sĩ</span><select class="select" id="afDoc"><option value="">Tất cả</option>
      ${DOCTORS.map(d => `<option>${esc(d)}</option>`).join("")}</select></label>
    <label class="f"><span>Bệnh nhân</span><select class="select" id="afPt"><option value="">Tất cả</option>
      ${PATIENTS.map(p => `<option value="${p.mrn}">${esc(p.name)}</option>`).join("")}</select></label>
    <label class="f"><span>Bệnh</span><select class="select" id="afDx"><option value="">Tất cả</option>
      ${groups.map(g => `<option>${esc(g)}</option>`).join("")}</select></label>
    <span class="grow" style="flex:1"></span>
    <span class="f"><span>&nbsp;</span><span class="muted-note">Kéo–thả lịch hẹn để đổi ngày · bấm vào lịch để sửa/xóa</span></span>`;
  $("#afDoc").addEventListener("change", e => { AS.filterDoctor = e.target.value; renderBody(); });
  $("#afPt").addEventListener("change", e => { AS.filterPatient = e.target.value; renderBody(); });
  $("#afDx").addEventListener("change", e => { AS.filterDisease = e.target.value; renderBody(); });
}

function apChip(a) {
  return `<div class="ap-chip ${specClass(a.specialty)}" draggable="true" data-id="${a.id}" data-mrn="${a.mrn}">
    <span class="t">${esc(a.time)}</span><span class="n">${esc(apName(a.mrn))}</span>
    <span class="s">${esc(a.specialty)}</span></div>`;
}

function renderBody() {
  const body = $("#apBody");
  if (AS.view === "week") renderWeek(body);
  else if (AS.view === "day") renderDay(body);
  else renderMonth(body);
}

function renderWeek(body) {
  const vis = visible();
  body.innerHTML = `<div class="ap-week">${WEEK_DATES.map((iso, i) => `
    <div class="ap-col ${iso === "2026-06-16" ? "today" : ""}" data-date="${iso}">
      <div class="ch"><div class="dow">${DOW[i]}</div><div class="dnum">${fmtVN(iso)}</div></div>
      ${vis.filter(a => a.date === iso).sort((x, y) => x.time.localeCompare(y.time)).map(apChip).join("")}
    </div>`).join("")}</div>`;
  wireChips(); wireDrop();
}

function renderDay(body) {
  const vis = visible().filter(a => a.date === AS.sel).sort((x, y) => x.time.localeCompare(y.time));
  body.innerHTML = `
    <div class="cal-toolbar"><strong>${fmtVN(AS.sel)}/2026</strong>
      <input class="input" type="date" id="apDayDate" value="${AS.sel}" style="min-width:0"></div>
    <div class="ap-day">${vis.length ? vis.map(a => `
      <div class="ap-item" data-id="${a.id}" data-mrn="${a.mrn}">
        <span class="time">${esc(a.time)}</span>
        <div class="grow"><strong>${esc(apName(a.mrn))}</strong> · ${esc(a.specialty)}
          <div class="muted-note">${esc(a.doctor)} — ${esc(a.note)}</div></div>
        <button class="btn btn-sm" data-edit="${a.id}">Sửa</button>
        <button class="btn btn-sm" onclick="openCase('${a.mrn}')">Mở ca</button>
      </div>`).join("") : `<div class="empty">Không có lịch hẹn trong ngày này.</div>`}</div>`;
  $("#apDayDate").addEventListener("change", e => { AS.sel = e.target.value; renderDay(body); });
  $all("[data-edit]").forEach(b => b.addEventListener("click", () => openAppt(b.dataset.edit)));
  $all(".ap-item[data-mrn]").forEach(el => attachPreview(el, el.dataset.mrn));
}

function renderMonth(body) {
  const vis = visible();
  let cells = DOW.map(d => `<div class="dow">${d}</div>`).join("");
  for (let day = 1; day <= 30; day++) {
    const iso = `2026-06-${String(day).padStart(2, "0")}`;
    const evs = vis.filter(a => a.date === iso).sort((x, y) => x.time.localeCompare(y.time));
    cells += `<div class="cell ${day === 16 ? "today" : ""}" data-date="${iso}">
      <span class="dn">${day}</span>
      ${evs.slice(0, 3).map(a => `<div class="ev">${esc(a.time)} ${esc(apName(a.mrn))}</div>`).join("")}
      ${evs.length > 3 ? `<div class="muted-note" style="margin-top:3px">+${evs.length - 3} nữa</div>` : ""}</div>`;
  }
  body.innerHTML = `<div class="ap-month">${cells}</div>`;
  $all(".ap-month .cell[data-date]").forEach(c => c.addEventListener("click", () => { AS.sel = c.dataset.date; AS.view = "day"; syncSeg(); renderBody(); }));
}

function wireChips() {
  $all(".ap-chip").forEach(ch => {
    attachPreview(ch, ch.dataset.mrn);
    ch.addEventListener("click", () => openAppt(ch.dataset.id));
    ch.addEventListener("dragstart", () => { AS._drag = ch.dataset.id; ch.classList.add("dragging"); });
    ch.addEventListener("dragend", () => ch.classList.remove("dragging"));
  });
}
function wireDrop() {
  $all(".ap-col").forEach(col => {
    col.addEventListener("dragover", e => { e.preventDefault(); col.classList.add("drop"); });
    col.addEventListener("dragleave", () => col.classList.remove("drop"));
    col.addEventListener("drop", e => {
      e.preventDefault(); col.classList.remove("drop");
      const a = AS.list.find(x => x.id === AS._drag);
      if (a && a.date !== col.dataset.date) {
        a.date = col.dataset.date;
        Metrics.track("appt_move", "Đổi ngày hẹn: " + apName(a.mrn));
        toast(`Đã chuyển lịch hẹn của ${apName(a.mrn)} sang ${fmtVN(a.date)}.`);
        renderBody();
      }
      AS._drag = null;
    });
  });
}

/* add / edit / delete via drawer */
function openAppt(id) {
  const editing = !!id;
  const a = editing ? AS.list.find(x => x.id === id)
    : { mrn: PATIENTS[0].mrn, date: AS.sel, time: "09:00", specialty: SPECIALTIES[0], doctor: DOCTORS[0], note: "" };
  openDrawer(editing ? "Sửa lịch hẹn" : "Thêm lịch hẹn", `
    ${fieldSelect("Bệnh nhân", "mrn", PATIENTS.map(p => `${p.name} (${p.mrn})`), `${apName(a.mrn)} (${a.mrn})`)}
    ${fieldInput("Ngày", "date", "date", a.date)}
    ${fieldInput("Giờ", "time", "time", a.time)}
    ${fieldSelect("Chuyên khoa", "spec", SPECIALTIES, a.specialty)}
    ${fieldSelect("Bác sĩ", "doc", DOCTORS, a.doctor)}
    ${fieldInput("Ghi chú", "note", "text", a.note)}
    <div class="drawer-actions">
      <button class="btn btn-leaf btn-block" id="apSave">${editing ? "Lưu" : "Thêm lịch hẹn"}</button>
      ${editing ? `<button class="btn btn-danger" id="apDel">Xóa</button>` : ""}
    </div>`, box => {
    $("#apSave", box).addEventListener("click", () => {
      const mrnSel = $('[name=mrn]', box).value.match(/\((\d+)\)/);
      const data = {
        id: a.id || ("a" + Date.now()), mrn: mrnSel ? mrnSel[1] : a.mrn,
        date: $('[name=date]', box).value, time: $('[name=time]', box).value,
        specialty: $('[name=spec]', box).value, doctor: $('[name=doc]', box).value,
        note: $('[name=note]', box).value,
      };
      if (editing) Object.assign(a, data); else AS.list.push(data);
      closeDrawer(); renderBody(); toast(editing ? "Đã lưu lịch hẹn." : "Đã thêm lịch hẹn.");
    });
    if (editing) $("#apDel", box).addEventListener("click", () => {
      AS.list = AS.list.filter(x => x.id !== id); closeDrawer(); renderBody(); toast("Đã xóa lịch hẹn.");
    });
  });
}

function syncSeg() { $all("#apSeg button").forEach(b => b.classList.toggle("active", b.dataset.v === AS.view)); }

document.addEventListener("DOMContentLoaded", () => {
  renderFilters();
  $all("#apSeg button").forEach(b => b.addEventListener("click", () => { AS.view = b.dataset.v; syncSeg(); renderBody(); }));
  $("#apAdd").addEventListener("click", () => openAppt(null));
  renderBody();
});
