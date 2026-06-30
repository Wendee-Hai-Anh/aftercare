# AfterCare — Post-discharge triage (front-end prototype)

A small multi-page front end for the AfterCare follow-up workflow, plus a
**separate live metrics dashboard** for whoever monitors product usage.

## Run it

Use the bundled static server so the live metrics linking works (it relies on
a shared site origin):

```bash
node server.js
# Doctor app:        http://127.0.0.1:5174/
# Metrics dashboard: http://127.0.0.1:5174/metrics.html
```

To see metrics update **live**, open the doctor app and `metrics.html` in two
tabs and interact with the doctor app — the dashboard ticks within ~2s.

## Doctor app screens (sidebar)

| Page                  | File                  |
|-----------------------|-----------------------|
| Bệnh nhân đợi theo dõi | `index.html`          |
| Dữ liệu bệnh nhân      | `patients.html`       |
| Giao thức và Ngưỡng cờ | `protocols.html`      |
| Lịch gọi               | `calls.html`          |
| Cuộc gọi tự động       | `bot-calls.html`      |
| Lịch hẹn               | `appointments.html`   |
| Cài đặt                | `settings.html`       |
| Chi tiết ca            | `case.html`           |
| Cuộc gọi (mô phỏng)    | `call-incoming.html`  |

**Cuộc gọi tự động** lets a doctor set the date/time for each patient's
automated call (on/off per patient) and manage the questions the assistant
asks, grouped by condition (add, remove, turn on/off). Changes are saved in
the browser under `aftercare_botcalls`.

## Metrics dashboard (separate — NOT in the doctor sidebar)

`metrics.html` is a standalone analytics surface. It reads the interaction log
the doctor app writes to the browser and renders, live:

- headline counts (total interactions, page views, calls, doctor instructions,
  bot-call changes),
- interactions grouped by type,
- most-viewed pages,
- a real-time activity feed.

It updates via `BroadcastChannel` + the `storage` event, with a 2-second
polling fallback. It never loads the doctor app's script, so viewing it does
not add to the numbers. Metrics are **not shown anywhere in the doctor app.**

## Plain language

Clinical-but-clear wording throughout; engineering jargon was removed
(e.g. "rule engine" → "Tự động cảnh báo khi gặp dấu hiệu này", "slot" →
"thông tin thu thập trong cuộc gọi", the call assistant is "Trợ lý").

## Shared layer

- `css/style.css` — tokens, sidebar, buttons, cards, pills, badges, tables, toast.
- `js/data.js` — all content: patients, queue, protocols, calls, appointments,
  case, bot schedule, question sets, label maps.
- `js/script.js` — sidebar, responsive menu, `toast()`, `trackGo()`, and the
  background `Metrics` collector (counts + live event log + broadcast).

Per-page CSS only where needed: `dashboard.css`, `patients.css`, `case.css`,
`call.css`, `bot-calls.css`, `metrics.css`.

## Editing tips

- Change content → edit `js/data.js`; pages re-render from it.
- Add a question set for a new condition → add to `CONDITIONS` + `QUESTION_SETS`.
- Flag/status wording lives once in `FLAG_LABEL` / `STATUS_LABEL`.
