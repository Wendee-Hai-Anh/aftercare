/* =========================================================================
   AfterCare · dashboard.js — actionable work board (condensed)
   ========================================================================= */

function dashActions() {
  const failed = AI_CALLS_TODAY.filter(c => c.status === "failed").length;
  $("#dashActions").innerHTML = `
    <a class="btn" href="manager.html#notifications">Thông báo${failed ? ` · ${failed}` : ""}</a>
    <a class="btn btn-leaf" href="manager.html#calendar">Quản lý gọi AI</a>`;
}

function quickCounts() {
  const review = QUEUE_NEEDS_REVIEW().length;
  const failed = AI_CALLS_TODAY.filter(c => c.status === "failed").length;
  const overdue = QUEUE_OVERDUE().length;
  $("#quickCounts").innerHTML = `
    <span class="quick"><span class="dot" style="background:var(--red)"></span>Cần xem <b>${review}</b></span>
    <span class="quick">Gọi AI hôm nay <b>${AI_CALLS_TODAY.length}</b></span>
    <span class="quick">Gọi thất bại <b>${failed}</b></span>
    <span class="quick">Quá hạn <b>${overdue}</b></span>
    <span class="quick">Lịch hẹn <b>${APPOINTMENTS_TODAY.length}</b></span>`;
}

function workItem(opts) {
  const actions = (opts.actions || []).map(a =>
    `<button class="btn btn-sm ${a.cls || ""}" type="button" data-act="${esc(a.act)}" data-mrn="${esc(opts.mrn || "")}">${esc(a.label)}</button>`
  ).join("");
  return `
    <div class="work-item ${opts.tone || ""}" ${opts.mrn ? `data-mrn="${esc(opts.mrn)}"` : ""}>
      <div>
        <div class="who">${opts.badge || ""}<strong>${esc(opts.title)}</strong>
          ${opts.meta ? `<span class="meta">${esc(opts.meta)}</span>` : ""}</div>
        ${opts.reason ? `<div class="reason">${esc(opts.reason)}</div>` : ""}
      </div>
      <div class="actions">${opts.time ? `<span class="time">${esc(opts.time)}</span>` : ""}${actions}</div>
    </div>`;
}

/* cap = max rows shown; total used for "see all (N)" */
function section(opts) {
  const total = opts.total != null ? opts.total : opts.items.length;
  const body = opts.items.length ? opts.items.join("")
    : `<div class="work-empty">${esc(opts.empty || "Không có mục nào.")}</div>`;
  const more = total > opts.items.length;
  return `
    <section class="work-section ${opts.primary ? "primary" : ""}">
      <div class="work-head">
        <span class="ico ${opts.tone}">${opts.icon || ""}</span>
        <span class="ttl">${esc(opts.title)}</span>
        <span class="count">${total}</span>
        <span class="grow"></span>
        ${opts.link ? `<a class="link" href="${opts.link}">${esc(more ? "Xem tất cả" : (opts.linkText || "Xem tất cả"))}</a>` : ""}
      </div>
      ${body}
    </section>`;
}

function renderBoard() {
  /* PRIMARY — Needs Review (strong CTA) */
  const review = QUEUE_NEEDS_REVIEW().map(p => workItem({
    mrn: p.mrn, tone: p.risk, badge: riskBadge(p.risk),
    title: p.name, meta: `${p.age}t · ${p.diagnosis} · ngày ${p.day}`, reason: p.reason,
    actions: [{ act: "open", label: "Xem & xử lý", cls: "btn-leaf" }, { act: "call", label: "Gọi" }],
  }));
  $("#boardPrimary").innerHTML = section({
    title: "Cần bác sĩ xem", tone: "red", icon: "!", primary: true, items: review,
    link: "patients.html", linkText: "Tất cả bệnh nhân", empty: "Không có ca nào cần xem.",
  });

  /* SECONDARY — lower attention, capped to 3, neutral buttons, masonry */
  const callsAll = AI_CALLS_TODAY;
  const calls = callsAll.slice(0, 3).map(c => workItem({
    mrn: c.mrn, tone: c.status === "failed" ? "red" : "info",
    title: c.name, meta: c.group,
    reason: `${CALL_STATUS[c.status].label}${c.attempt > 1 ? ` · lần ${c.attempt}` : ""}`, time: c.time,
    actions: c.status === "failed" ? [{ act: "call", label: "Gọi lại" }, { act: "open", label: "Mở ca" }]
                                    : [{ act: "open", label: "Mở ca" }],
  }));

  const failedAll = AI_CALLS_TODAY.filter(c => c.status === "failed");
  const failed = failedAll.slice(0, 3).map(c => workItem({
    mrn: c.mrn, tone: "red", title: c.name, meta: c.group,
    reason: `Đã thử ${c.attempt} lần`, time: c.time,
    actions: [{ act: "call", label: "Gọi lại" }, { act: "open", label: "Mở ca" }],
  }));

  const overdueAll = QUEUE_OVERDUE();
  const overdue = overdueAll.slice(0, 3).map(p => workItem({
    mrn: p.mrn, tone: "amber", title: p.name, meta: `${p.diagnosis} · ngày ${p.day}`, reason: p.reason,
    actions: [{ act: "open", label: "Mở ca" }],
  }));

  const apptsAll = APPOINTMENTS_TODAY;
  const appts = apptsAll.slice(0, 3).map(a => workItem({
    mrn: a.mrn, tone: "info", title: a.name, meta: a.specialty, reason: a.note, time: a.time,
    actions: [{ act: "appts", label: "Xem lịch" }],
  }));

  $("#boardSec").innerHTML =
    section({ title: "Cuộc gọi AI hôm nay", tone: "info", icon: "☎", items: calls, total: callsAll.length,
              link: "manager.html#calendar", empty: "Hôm nay không có cuộc gọi." }) +
    section({ title: "Cuộc gọi thất bại", tone: "red", icon: "⟳", items: failed, total: failedAll.length,
              link: "manager.html#notifications", empty: "Không có cuộc gọi thất bại." }) +
    section({ title: "Theo dõi quá hạn", tone: "amber", icon: "⏱", items: overdue, total: overdueAll.length,
              link: "patients.html", empty: "Không có ca quá hạn." }) +
    section({ title: "Lịch hẹn hôm nay", tone: "green", icon: "◷", items: appts, total: apptsAll.length,
              link: "appointments.html", empty: "Hôm nay không có lịch hẹn." });

  wireBoard();
}

function wireBoard() {
  $all(".work-item[data-mrn]").forEach(row => {
    attachPreview(row, row.dataset.mrn);
    row.addEventListener("click", e => { if (!e.target.closest("[data-act]")) openCase(row.dataset.mrn); });
  });
  $all("[data-act]").forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation();
    const mrn = btn.dataset.mrn, act = btn.dataset.act;
    if (act === "open") openCase(mrn);
    else if (act === "call") trackGo("call:start", "Gọi: " + mrn, "call.html?id=" + mrn);
    else if (act === "appts") location.href = "appointments.html";
  }));
}

document.addEventListener("DOMContentLoaded", () => { dashActions(); quickCounts(); renderBoard(); });
