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
  let state = load();
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupted state — start fresh */ }
    return { stops: [], packing: DEFAULT_PACKING, expenses: [], people: 2, plates: [], catIdx: 0 };
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked */ }
  }

  const $ = (sel) => document.querySelector(sel);

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

      const up = button("mini-btn", "▲", () => { swap(stops, i, i - 1); });
      const down = button("mini-btn", "▼", () => { swap(stops, i, i + 1); });
      up.disabled = i === 0;
      down.disabled = i === stops.length - 1;
      const del = button("mini-btn danger", "✕", () => { stops.splice(i, 1); save(); renderTrip(); });

      li.append(check, body, up, down, del);
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

  // ---------- expenses ----------
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

    const total = exps.reduce((sum, x) => sum + x.amount, 0);
    $("#exp-total").textContent = fmtMoney(total);
    $("#people-count").textContent = state.people;
    $("#exp-per-person").textContent = fmtMoney(total / state.people);

    const byCat = {};
    exps.forEach((x) => { byCat[x.cat] = (byCat[x.cat] || 0) + x.amount; });
    $("#exp-by-cat").textContent = Object.entries(byCat)
      .map(([c, v]) => `${c} ${fmtMoney(v)}`)
      .join("   ");

    [...exps].reverse().forEach((exp) => {
      const li = document.createElement("li");
      const body = document.createElement("div");
      body.className = "item-body";
      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = exp.cat + (exp.note ? " · " + exp.note : "");
      const sub = document.createElement("div");
      sub.className = "item-sub";
      sub.textContent = new Date(exp.at).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
      body.append(title, sub);
      const amount = document.createElement("span");
      amount.className = "exp-amount";
      amount.textContent = fmtMoney(exp.amount);
      const del = button("mini-btn danger", "✕", () => {
        state.expenses = state.expenses.filter((x) => x.id !== exp.id);
        save();
        renderExpenses();
      });
      li.append(body, amount, del);
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
    PLATES.forEach((code) => {
      const spotted = state.plates.includes(code);
      const btn = button("plate" + (spotted ? " spotted" : ""), code, () => {
        state.plates = spotted ? state.plates.filter((c) => c !== code) : [...state.plates, code];
        save();
        renderPlates();
      });
      grid.append(btn);
    });
    $("#plate-count").textContent = state.plates.length;
  }
  $("#plate-reset").addEventListener("click", () => {
    state.plates = [];
    save();
    renderPlates();
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

  renderTrip();
  renderPacking();
  renderCatChips();
  renderExpenses();
  renderPlates();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
  }
})();
