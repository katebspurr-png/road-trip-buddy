/* Road Trip Buddy — all state lives in localStorage, everything works offline. */
(() => {
  "use strict";

  const STORAGE_KEY = "rtb-state-v1";

  const DEFAULT_PACKING = [
    ["Essentials", ["Driver's license & insurance card", "Phone chargers + cable", "Water bottles", "Snacks", "Sunglasses", "Medications", "Cash for tolls"]],
    ["Car", ["Check tire pressure & oil", "Phone mount", "Jumper cables", "Napkins / wet wipes", "Trash bag", "Spare tire kit"]],
    ["Comfort", ["Pillow & blanket", "Download playlists offline", "Download offline maps", "Books / podcasts queued", "Hoodie or layer"]],
  ].flatMap(([group, items]) =>
    items.map((name) => ({ id: uid(), name, group, checked: false }))
  );

  const CATEGORIES = ["⛽ Gas", "🍔 Food", "🛏️ Lodging", "🎢 Fun", "📦 Other"];

  const PLATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
  const PLATES_CA = ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"];

  const PROMPTS = [
    "What's the best meal you've ever had on a trip?",
    "If this car could drive anywhere in the world right now, where are we going?",
    "Would you rather always have to sing instead of speak, or dance everywhere you walk?",
    "What's your most irrational fear?",
    "Two truths and a lie — go.",
    "What was your first screen name or email address?",
    "If you had to eat one road-trip snack forever, what is it?",
    "What's a skill you wish you'd learned as a kid?",
    "Describe everyone in this car in exactly three words each.",
    "What's the weirdest thing you've ever seen on the side of a road?",
    "If we broke down right here, who in this car survives longest?",
    "What song do you secretly love but never admit to?",
    "Best concert or live event you've ever been to?",
    "You get one superpower but only while inside a moving vehicle. What is it?",
    "What's a hill you'll die on that nobody agrees with?",
    "If this trip had a movie title, what would it be?",
    "What's the most trouble you got into as a kid?",
    "Pick a decade: which one would you road trip in besides this one?",
    "What smell instantly takes you back to childhood?",
    "Everyone gets $500 to spend at the next stop. What do you buy?",
    "Which fictional character would be the worst passenger in this car?",
    "What's your go-to karaoke song? (You must now perform it.)",
    "What's something you believed way too long as a kid?",
    "If you opened a roadside attraction, what would it be?",
    "Rank the last three places we stopped. Defend your ranking.",
  ];

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---------- state ----------
  function defaults() {
    return { stops: [], packing: DEFAULT_PACKING, expenses: [], people: 2, plates: [], catIdx: 0, travelers: [], payerId: null, platesCanada: false };
  }
  let state = load();
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaults(), ...JSON.parse(raw) };
    } catch (e) { /* corrupted state — start fresh */ }
    return defaults();
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked */ }
  }

  const $ = (sel) => document.querySelector(sel);

  /* which list item is in edit mode: { type: "stop"|"exp", id } */
  let editing = null;
  function isEditing(type, id) {
    return editing && editing.type === type && editing.id === id;
  }

  // ---------- tabs ----------
  const views = { trip: $("#view-trip"), packing: $("#view-packing"), expenses: $("#view-expenses"), games: $("#view-games") };
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
      Object.entries(views).forEach(([name, el]) => { el.hidden = name !== tab.dataset.view; });
      window.scrollTo(0, 0);
    });
  });

  function fmtMoney(n) {
    return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ---------- trip ----------
  function renderTrip() {
    const list = $("#stop-list");
    list.innerHTML = "";
    const stops = state.stops;
    $("#trip-empty").hidden = stops.length > 0;
    $("#trip-progress").hidden = stops.length === 0;
    const done = stops.filter((s) => s.done).length;
    if (stops.length) {
      $("#trip-progress-fill").style.width = (done / stops.length) * 100 + "%";
      $("#trip-progress-label").textContent = `${done}/${stops.length} stops`;
    }
    $("#header-sub").textContent = stops.length ? `${stops.length - done} stops to go` : "";

    stops.forEach((stop, i) => {
      const li = document.createElement("li");

      if (isEditing("stop", stop.id)) {
        li.className = "editing";
        const fields = document.createElement("div");
        fields.className = "edit-fields";
        const nameIn = editInput("text", stop.name, "Stop name");
        const noteIn = editInput("text", stop.note || "", "Note (optional)");
        fields.append(nameIn, noteIn);
        const ok = button("mini-btn ok", "✓", () => {
          const name = nameIn.value.trim();
          if (name) stop.name = name;
          stop.note = noteIn.value.trim();
          editing = null;
          save();
          renderTrip();
        });
        const cancel = button("mini-btn", "✕", () => { editing = null; renderTrip(); });
        const actions = document.createElement("div");
        actions.className = "edit-actions";
        actions.append(ok, cancel);
        li.append(fields, actions);
        list.append(li);
        return;
      }

      li.className = stop.done ? "checked" : "";

      const check = button("check", "✓", () => { stop.done = !stop.done; save(); renderTrip(); });
      check.setAttribute("aria-label", stop.done ? "mark not arrived" : "mark arrived");

      const body = document.createElement("div");
      body.className = "item-body";
      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = `${i + 1}. ${stop.name}`;
      const sub = document.createElement("div");
      sub.className = "item-sub";
      if (stop.note) sub.append(stop.note + " · ");
      const map = document.createElement("a");
      map.href = "https://maps.google.com/?q=" + encodeURIComponent(stop.name);
      map.target = "_blank";
      map.rel = "noopener";
      map.textContent = "map ↗";
      sub.append(map);
      body.append(title, sub);

      const edit = button("mini-btn", "✎", () => { editing = { type: "stop", id: stop.id }; renderTrip(); });
      edit.setAttribute("aria-label", "edit stop");
      const up = button("mini-btn", "▲", () => { swap(stops, i, i - 1); });
      const down = button("mini-btn", "▼", () => { swap(stops, i, i + 1); });
      up.disabled = i === 0;
      down.disabled = i === stops.length - 1;
      const del = button("mini-btn danger", "✕", () => { stops.splice(i, 1); save(); renderTrip(); });

      li.append(check, body, edit, up, down, del);
      list.append(li);
    });
  }
  function swap(arr, a, b) {
    if (b < 0 || b >= arr.length) return;
    [arr[a], arr[b]] = [arr[b], arr[a]];
    save();
    renderTrip();
  }
  $("#stop-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#stop-name").value.trim();
    if (!name) return;
    state.stops.push({ id: uid(), name, note: $("#stop-note").value.trim(), done: false });
    e.target.reset();
    save();
    renderTrip();
  });

  // ---------- packing ----------
  function renderPacking() {
    const list = $("#pack-list");
    list.innerHTML = "";
    const items = state.packing;
    const done = items.filter((p) => p.checked).length;
    $("#pack-progress-fill").style.width = items.length ? (done / items.length) * 100 + "%" : "0%";
    $("#pack-progress-label").textContent = `${done}/${items.length} packed`;

    let lastGroup = null;
    items.forEach((item) => {
      const group = item.group || "My items";
      if (group !== lastGroup) {
        lastGroup = group;
        const label = document.createElement("li");
        label.className = "group-label";
        label.textContent = group;
        list.append(label);
      }
      const li = document.createElement("li");
      li.className = item.checked ? "checked" : "";
      const check = button("check", "✓", () => { item.checked = !item.checked; save(); renderPacking(); });
      const body = document.createElement("div");
      body.className = "item-body";
      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = item.name;
      body.append(title);
      const del = button("mini-btn danger", "✕", () => {
        state.packing = state.packing.filter((p) => p.id !== item.id);
        save();
        renderPacking();
      });
      li.append(check, body, del);
      list.append(li);
    });
  }
  $("#pack-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#pack-name").value.trim();
    if (!name) return;
    state.packing.push({ id: uid(), name, group: "My items", checked: false });
    e.target.reset();
    save();
    renderPacking();
  });
  $("#pack-reset").addEventListener("click", () => {
    state.packing.forEach((p) => { p.checked = false; });
    save();
    renderPacking();
  });

  // ---------- travelers ----------
  function travelerById(id) {
    return state.travelers.find((t) => t.id === id) || null;
  }
  function renderTravelers() {
    const row = $("#traveler-chips");
    row.innerHTML = "";
    state.travelers.forEach((t) => {
      const chip = button("chip", t.name + " ✕", () => {
        state.travelers = state.travelers.filter((x) => x.id !== t.id);
        if (state.payerId === t.id) state.payerId = null;
        save();
        renderTravelers();
        renderPayerChips();
        renderExpenses();
      });
      chip.setAttribute("aria-label", "remove " + t.name);
      row.append(chip);
    });
    $("#traveler-empty").hidden = state.travelers.length > 0;
  }
  $("#traveler-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#traveler-name").value.trim();
    if (!name) return;
    if (state.travelers.some((t) => t.name.toLowerCase() === name.toLowerCase())) return;
    state.travelers.push({ id: uid(), name });
    e.target.reset();
    save();
    renderTravelers();
    renderPayerChips();
    renderExpenses();
  });

  function currentPayerId() {
    if (state.travelers.length < 2) return null;
    if (travelerById(state.payerId)) return state.payerId;
    return state.travelers[0].id;
  }
  function renderPayerChips() {
    const wrap = $("#exp-paidby");
    const hasTravelers = state.travelers.length >= 2;
    wrap.hidden = !hasTravelers;
    wrap.innerHTML = "";
    if (!hasTravelers) return;
    const label = document.createElement("span");
    label.className = "paidby-label";
    label.textContent = "Paid by";
    wrap.append(label);
    const active = currentPayerId();
    state.travelers.forEach((t) => {
      const chip = button("chip" + (t.id === active ? " active" : ""), t.name, () => {
        state.payerId = t.id;
        save();
        renderPayerChips();
      });
      wrap.append(chip);
    });
  }

  // ---------- expenses ----------
  function computeSettleUp() {
    const travelers = state.travelers;
    if (travelers.length < 2) return null;
    const ids = new Set(travelers.map((t) => t.id));
    const attributed = state.expenses.filter((x) => x.paidBy && ids.has(x.paidBy));
    const balance = {};
    travelers.forEach((t) => { balance[t.id] = 0; });
    attributed.forEach((x) => {
      balance[x.paidBy] += x.amount;
      const share = x.amount / travelers.length;
      travelers.forEach((t) => { balance[t.id] -= share; });
    });
    const debtors = [], creditors = [];
    Object.entries(balance).forEach(([id, b]) => {
      if (b < -0.005) debtors.push({ id, amt: -b });
      else if (b > 0.005) creditors.push({ id, amt: b });
    });
    debtors.sort((a, b) => b.amt - a.amt);
    creditors.sort((a, b) => b.amt - a.amt);
    const lines = [];
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const pay = Math.min(debtors[di].amt, creditors[ci].amt);
      lines.push({ from: travelerById(debtors[di].id).name, to: travelerById(creditors[ci].id).name, amt: pay });
      debtors[di].amt -= pay;
      creditors[ci].amt -= pay;
      if (debtors[di].amt < 0.005) di++;
      if (creditors[ci].amt < 0.005) ci++;
    }
    return { lines, unassigned: state.expenses.length - attributed.length };
  }

  function renderCatChips() {
    const row = $("#exp-cats");
    row.innerHTML = "";
    CATEGORIES.forEach((cat, i) => {
      const chip = button("chip" + (i === state.catIdx ? " active" : ""), cat, () => {
        state.catIdx = i;
        save();
        renderCatChips();
      });
      chip.type = "button";
      row.append(chip);
    });
  }
  function renderExpenses() {
    const list = $("#exp-list");
    list.innerHTML = "";
    const exps = state.expenses;
    $("#exp-empty").hidden = exps.length > 0;

    const hasTravelers = state.travelers.length >= 2;
    const splitWays = hasTravelers ? state.travelers.length : state.people;
    const total = exps.reduce((sum, x) => sum + x.amount, 0);
    $("#exp-total").textContent = fmtMoney(total);
    $("#people-count").textContent = splitWays;
    $("#exp-per-person").textContent = fmtMoney(total / splitWays);
    $("#people-minus").hidden = hasTravelers;
    $("#people-plus").hidden = hasTravelers;

    const byCat = {};
    exps.forEach((x) => { byCat[x.cat] = (byCat[x.cat] || 0) + x.amount; });
    $("#exp-by-cat").textContent = Object.entries(byCat)
      .map(([c, v]) => `${c} ${fmtMoney(v)}`)
      .join("   ");

    const settle = computeSettleUp();
    const settleBox = $("#settle-lines");
    settleBox.innerHTML = "";
    if (settle && (settle.lines.length || settle.unassigned)) {
      settle.lines.forEach((l) => {
        const div = document.createElement("div");
        div.textContent = `${l.from} owes ${l.to} ${fmtMoney(l.amt)}`;
        settleBox.append(div);
      });
      if (!settle.lines.length && state.expenses.length) {
        const div = document.createElement("div");
        div.textContent = "All square ✓";
        settleBox.append(div);
      }
      if (settle.unassigned) {
        const note = document.createElement("div");
        note.className = "settle-note";
        note.textContent = `${settle.unassigned} expense${settle.unassigned > 1 ? "s" : ""} without a payer — not counted in settle-up`;
        settleBox.append(note);
      }
    }
    $("#exp-share").hidden = exps.length === 0;

    [...exps].reverse().forEach((exp) => {
      const li = document.createElement("li");

      if (isEditing("exp", exp.id)) {
        li.className = "editing";
        const fields = document.createElement("div");
        fields.className = "edit-fields";
        const amountIn = editInput("number", exp.amount, "0.00");
        amountIn.step = "0.01";
        amountIn.min = "0.01";
        amountIn.inputMode = "decimal";
        const catSel = document.createElement("select");
        CATEGORIES.forEach((c) => catSel.append(new Option(c, c)));
        catSel.value = CATEGORIES.includes(exp.cat) ? exp.cat : CATEGORIES[CATEGORIES.length - 1];
        const noteIn = editInput("text", exp.note || "", "Note (optional)");
        fields.append(amountIn, catSel, noteIn);
        let payerSel = null;
        if (state.travelers.length >= 2) {
          payerSel = document.createElement("select");
          payerSel.append(new Option("Paid by — not set", ""));
          state.travelers.forEach((t) => payerSel.append(new Option("Paid by " + t.name, t.id)));
          payerSel.value = travelerById(exp.paidBy) ? exp.paidBy : "";
          fields.append(payerSel);
        }
        const ok = button("mini-btn ok", "✓", () => {
          const amount = parseFloat(amountIn.value);
          if (amount > 0) exp.amount = Math.round(amount * 100) / 100;
          exp.cat = catSel.value;
          exp.note = noteIn.value.trim();
          if (payerSel) exp.paidBy = payerSel.value || null;
          editing = null;
          save();
          renderExpenses();
        });
        const cancel = button("mini-btn", "✕", () => { editing = null; renderExpenses(); });
        const actions = document.createElement("div");
        actions.className = "edit-actions";
        actions.append(ok, cancel);
        li.append(fields, actions);
        list.append(li);
        return;
      }

      const body = document.createElement("div");
      body.className = "item-body";
      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = exp.cat + (exp.note ? " · " + exp.note : "");
      const sub = document.createElement("div");
      sub.className = "item-sub";
      const payer = travelerById(exp.paidBy);
      sub.textContent =
        new Date(exp.at).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }) +
        (payer ? " · " + payer.name + " paid" : "");
      body.append(title, sub);
      const amount = document.createElement("span");
      amount.className = "exp-amount";
      amount.textContent = fmtMoney(exp.amount);
      const edit = button("mini-btn", "✎", () => { editing = { type: "exp", id: exp.id }; renderExpenses(); });
      edit.setAttribute("aria-label", "edit expense");
      const del = button("mini-btn danger", "✕", () => {
        state.expenses = state.expenses.filter((x) => x.id !== exp.id);
        save();
        renderExpenses();
      });
      li.append(body, amount, edit, del);
      list.append(li);
    });
  }
  $("#exp-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseFloat($("#exp-amount").value);
    if (!(amount > 0)) return;
    state.expenses.push({
      id: uid(),
      amount: Math.round(amount * 100) / 100,
      cat: CATEGORIES[state.catIdx],
      note: $("#exp-note").value.trim(),
      paidBy: currentPayerId(),
      at: Date.now(),
    });
    e.target.reset();
    save();
    renderExpenses();
  });
  $("#people-minus").addEventListener("click", () => {
    state.people = Math.max(1, state.people - 1);
    save();
    renderExpenses();
  });
  $("#people-plus").addEventListener("click", () => {
    state.people = Math.min(20, state.people + 1);
    save();
    renderExpenses();
  });

  // ---------- share settle-up ----------
  function summaryText() {
    const total = state.expenses.reduce((sum, x) => sum + x.amount, 0);
    const byCat = {};
    state.expenses.forEach((x) => { byCat[x.cat] = (byCat[x.cat] || 0) + x.amount; });
    const hasTravelers = state.travelers.length >= 2;
    const splitWays = hasTravelers ? state.travelers.length : state.people;
    const lines = [
      "🛣️ Road Trip Buddy — expenses",
      "Total: " + fmtMoney(total),
      ...Object.entries(byCat).map(([c, v]) => `  ${c} ${fmtMoney(v)}`),
      `Split ${splitWays} ways: ${fmtMoney(total / splitWays)} each`,
    ];
    const settle = computeSettleUp();
    if (settle && settle.lines.length) {
      lines.push("Settle up:");
      settle.lines.forEach((l) => lines.push(`  ${l.from} owes ${l.to} ${fmtMoney(l.amt)}`));
    }
    return lines.join("\n");
  }
  $("#exp-share").addEventListener("click", async () => {
    const text = summaryText();
    const btn = $("#exp-share");
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        const old = btn.textContent;
        btn.textContent = "Copied to clipboard ✓";
        setTimeout(() => { btn.textContent = old; }, 1800);
      }
    } catch (e) { /* user cancelled the share sheet */ }
  });

  // ---------- games ----------
  let lastPrompt = -1;
  $("#prompt-btn").addEventListener("click", () => {
    let i;
    do { i = Math.floor(Math.random() * PROMPTS.length); } while (i === lastPrompt && PROMPTS.length > 1);
    lastPrompt = i;
    $("#prompt-text").textContent = PROMPTS[i];
  });

  function renderPlates() {
    const grid = $("#plate-grid");
    grid.innerHTML = "";
    const all = state.platesCanada ? [...PLATES, ...PLATES_CA] : PLATES;
    all.forEach((code) => {
      const spotted = state.plates.includes(code);
      const btn = button("plate" + (spotted ? " spotted" : ""), code, () => {
        state.plates = spotted ? state.plates.filter((c) => c !== code) : [...state.plates, code];
        save();
        renderPlates();
      });
      grid.append(btn);
    });
    $("#plate-count").textContent = state.plates.filter((c) => all.includes(c)).length;
    $("#plate-total").textContent = all.length;
    $("#plates-canada").checked = state.platesCanada;
  }
  $("#plates-canada").addEventListener("change", (e) => {
    state.platesCanada = e.target.checked;
    save();
    renderPlates();
  });
  $("#plate-reset").addEventListener("click", () => {
    state.plates = [];
    save();
    renderPlates();
  });

  // ---------- backup ----------
  $("#backup-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "road-trip-buddy-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $("#backup-import").addEventListener("click", () => $("#backup-file").click());
  $("#backup-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try { data = JSON.parse(reader.result); } catch (err) { data = null; }
      if (!data || !Array.isArray(data.stops) || !Array.isArray(data.packing) || !Array.isArray(data.expenses)) {
        $("#backup-status").textContent = "That file doesn't look like a Road Trip Buddy backup.";
        return;
      }
      if (!confirm("Replace everything in the app with this backup?")) return;
      state = { ...defaults(), ...data };
      editing = null;
      save();
      renderAll();
      $("#backup-status").textContent = "Backup restored ✓";
      setTimeout(() => { $("#backup-status").textContent = ""; }, 2500);
    };
    reader.readAsText(file);
  });

  // ---------- helpers & init ----------
  function button(className, text, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = className;
    b.textContent = text;
    b.addEventListener("click", onClick);
    return b;
  }
  function editInput(type, value, placeholder) {
    const el = document.createElement("input");
    el.type = type;
    el.value = value;
    el.placeholder = placeholder;
    return el;
  }

  function renderAll() {
    renderTrip();
    renderPacking();
    renderTravelers();
    renderPayerChips();
    renderCatChips();
    renderExpenses();
    renderPlates();
  }
  renderAll();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
  }
})();
