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

  const BINGO_POOL = [
    "Cow", "Horse", "Water tower", "Red barn", "Wind turbine", "Motorcycle", "School bus",
    "Yellow car", "Convertible", "Boat on a trailer", "Out-of-province plate", "Rest area sign",
    "Railroad crossing", "Train", "Bridge", "Tunnel", "Lighthouse", "Ferry", "Moose sign",
    "Deer (a real one)", "Tim Hortons", "Golden arches", "Police car", "Ambulance", "Fire truck",
    "Helicopter", "Plane overhead", "Rainbow", "Roadside fruit stand", "Church steeple",
    "Funny bumper sticker", "Mattress on a roof", "Broken-down car", "Cyclist", "Tractor",
    "Dog out the window", "Driver singing", "Speed trap", "Graffiti", "Antique car", "Limo",
    "RV / camper", "Hay bales", "Fireworks billboard", "Someone eating while driving",
  ];
  const BINGO_LINES = (() => {
    const lines = [];
    for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
    for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
    lines.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
    return lines;
  })();

  const TRIVIA = [
    // 🍁 Canada
    { c: "🍁 Canada", q: "What's the capital of Canada?", a: "Ottawa" },
    { c: "🍁 Canada", q: "How many provinces does Canada have?", a: "10 (plus 3 territories)" },
    { c: "🍁 Canada", q: "Name Canada's three territories.", a: "Yukon, Northwest Territories, and Nunavut" },
    { c: "🍁 Canada", q: "What's the smallest Canadian province?", a: "Prince Edward Island" },
    { c: "🍁 Canada", q: "Which province is Halifax in?", a: "Nova Scotia (trick question for this car?)" },
    { c: "🍁 Canada", q: "How many time zones does Canada span?", a: "Six" },
    { c: "🍁 Canada", q: "What's the national animal of Canada?", a: "The beaver" },
    { c: "🍁 Canada", q: "What bird is on the Canadian $1 coin?", a: "A loon — hence \"loonie\"" },
    { c: "🍁 Canada", q: "What are Canada's two national sports?", a: "Hockey (winter) and lacrosse (summer)" },
    { c: "🍁 Canada", q: "Roughly how long is the Trans-Canada Highway?", a: "About 7,800 km — one of the longest national highways on Earth" },
    { c: "🍁 Canada", q: "The CN Tower is in which city?", a: "Toronto" },
    { c: "🍁 Canada", q: "The Bay of Fundy is famous for what?", a: "The highest tides in the world" },
    { c: "🍁 Canada", q: "Anne of Green Gables is set in which province?", a: "Prince Edward Island" },
    { c: "🍁 Canada", q: "Niagara Falls sits on the border of which two countries?", a: "Canada and the USA" },
    { c: "🍁 Canada", q: "Peggy's Cove is famous for what?", a: "Its lighthouse — one of the most photographed in the world" },
    // 🌍 Geography
    { c: "🌍 Geography", q: "What's the biggest country in the world by area?", a: "Russia" },
    { c: "🌍 Geography", q: "What's the largest ocean?", a: "The Pacific" },
    { c: "🌍 Geography", q: "What's the longest river in the world?", a: "The Nile (by most measurements)" },
    { c: "🌍 Geography", q: "What's the tallest mountain on Earth?", a: "Mount Everest" },
    { c: "🌍 Geography", q: "What's the world's largest desert?", a: "Antarctica — deserts are about dryness, not sand" },
    { c: "🌍 Geography", q: "How many continents are there?", a: "Seven" },
    { c: "🌍 Geography", q: "How many states does the USA have?", a: "50" },
    { c: "🌍 Geography", q: "What's the capital of the USA?", a: "Washington, D.C." },
    { c: "🌍 Geography", q: "Which US state is the Grand Canyon in?", a: "Arizona" },
    { c: "🌍 Geography", q: "Which US state is closest to Nova Scotia?", a: "Maine" },
    { c: "🌍 Geography", q: "Which country has the most people?", a: "India (it passed China in 2023)" },
    { c: "🌍 Geography", q: "What's the smallest country in the world?", a: "Vatican City" },
    { c: "🌍 Geography", q: "Which country has the most islands?", a: "Sweden — over 260,000" },
    { c: "🌍 Geography", q: "What's the capital of Australia?", a: "Canberra — not Sydney" },
    { c: "🌍 Geography", q: "Which two countries share the world's longest border?", a: "Canada and the USA" },
    // 🚗 Cars & Roads
    { c: "🚗 Cars & Roads", q: "What animal is on the Porsche logo?", a: "A horse" },
    { c: "🚗 Cars & Roads", q: "What animal is on the Lamborghini logo?", a: "A bull" },
    { c: "🚗 Cars & Roads", q: "What company makes the Mustang?", a: "Ford" },
    { c: "🚗 Cars & Roads", q: "How many wheels does an \"18-wheeler\" have?", a: "18" },
    { c: "🚗 Cars & Roads", q: "What does a red octagon road sign mean?", a: "Stop" },
    { c: "🚗 Cars & Roads", q: "Roughly how many kilometres are in a mile?", a: "1.6" },
    { c: "🚗 Cars & Roads", q: "What does GPS stand for?", a: "Global Positioning System" },
    { c: "🚗 Cars & Roads", q: "What side of the road do they drive on in the UK?", a: "The left" },
    { c: "🚗 Cars & Roads", q: "What does the H in HOV lane stand for?", a: "High — High-Occupancy Vehicle" },
    { c: "🚗 Cars & Roads", q: "What was the first mass-produced car?", a: "The Ford Model T" },
    { c: "🚗 Cars & Roads", q: "Which country's highways famously have stretches with no speed limit?", a: "Germany — the Autobahn" },
    { c: "🚗 Cars & Roads", q: "What colour were North American stop signs before the 1950s?", a: "Yellow — red paint didn't last outdoors until then" },
    { c: "🚗 Cars & Roads", q: "What does VW stand for?", a: "Volkswagen — \"people's car\" in German" },
    { c: "🚗 Cars & Roads", q: "What's the name of the Rolls-Royce hood ornament?", a: "The Spirit of Ecstasy" },
    { c: "🚗 Cars & Roads", q: "Route 66 connected Chicago to which city?", a: "Los Angeles (Santa Monica)" },
    // 🔬 Science & Nature
    { c: "🔬 Science & Nature", q: "Which planet is closest to the sun?", a: "Mercury" },
    { c: "🔬 Science & Nature", q: "Which planet is the hottest?", a: "Venus" },
    { c: "🔬 Science & Nature", q: "Which planet is famous for its rings?", a: "Saturn" },
    { c: "🔬 Science & Nature", q: "What does the H in H₂O stand for?", a: "Hydrogen" },
    { c: "🔬 Science & Nature", q: "What's the fastest land animal?", a: "The cheetah" },
    { c: "🔬 Science & Nature", q: "What's the largest animal to ever live?", a: "The blue whale" },
    { c: "🔬 Science & Nature", q: "What's the tallest animal?", a: "The giraffe" },
    { c: "🔬 Science & Nature", q: "What's the loudest animal on Earth?", a: "The sperm whale (louder than a jet engine)" },
    { c: "🔬 Science & Nature", q: "How many minutes are in a full day?", a: "1,440" },
    { c: "🔬 Science & Nature", q: "How many hearts does an octopus have?", a: "Three" },
    { c: "🔬 Science & Nature", q: "What gas do plants breathe in?", a: "Carbon dioxide (CO₂)" },
    { c: "🔬 Science & Nature", q: "How many bones are in an adult human body?", a: "206" },
    { c: "🔬 Science & Nature", q: "What's the only mammal that can truly fly?", a: "The bat" },
    { c: "🔬 Science & Nature", q: "What's a group of crows called?", a: "A murder" },
    { c: "🔬 Science & Nature", q: "Roughly how fast does light travel?", a: "300,000 km per second" },
    // 🎬 Pop Culture
    { c: "🎬 Pop Culture", q: "Who painted the Mona Lisa?", a: "Leonardo da Vinci" },
    { c: "🎬 Pop Culture", q: "In Monopoly, what are the two most expensive properties?", a: "Boardwalk and Park Place" },
    { c: "🎬 Pop Culture", q: "How many strings does a standard guitar have?", a: "Six" },
    { c: "🎬 Pop Culture", q: "How many keys does a full piano have?", a: "88" },
    { c: "🎬 Pop Culture", q: "How many houses is Hogwarts divided into?", a: "Four" },
    { c: "🎬 Pop Culture", q: "Who lives in a pineapple under the sea?", a: "SpongeBob SquarePants" },
    { c: "🎬 Pop Culture", q: "The Beatles came from which city?", a: "Liverpool" },
    { c: "🎬 Pop Culture", q: "What's the highest-grossing film of all time?", a: "Avatar" },
    { c: "🎬 Pop Culture", q: "What's the name of Mickey Mouse's dog?", a: "Pluto" },
    { c: "🎬 Pop Culture", q: "Complete the line: \"May the ___ be with you.\"", a: "Force" },
    { c: "🎬 Pop Culture", q: "Which superhero comes from the planet Krypton?", a: "Superman" },
    { c: "🎬 Pop Culture", q: "The Simpsons live in which town?", a: "Springfield" },
    { c: "🎬 Pop Culture", q: "What board game is played with letter tiles?", a: "Scrabble" },
    { c: "🎬 Pop Culture", q: "What's James Bond's code number?", a: "007" },
    { c: "🎬 Pop Culture", q: "What are Taylor Swift's fans called?", a: "Swifties" },
    // 🍔 Food
    { c: "🍔 Food", q: "Which country invented pizza?", a: "Italy" },
    { c: "🍔 Food", q: "What fruit do raisins come from?", a: "Grapes" },
    { c: "🍔 Food", q: "What fruit is dried to make prunes?", a: "Plums" },
    { c: "🍔 Food", q: "What are the three ingredients of poutine?", a: "Fries, cheese curds, and gravy" },
    { c: "🍔 Food", q: "What's the main ingredient in guacamole?", a: "Avocado" },
    { c: "🍔 Food", q: "Which nut gives Nutella its flavour?", a: "Hazelnut" },
    { c: "🍔 Food", q: "Sushi originally comes from which country?", a: "Japan" },
    { c: "🍔 Food", q: "Which country is the croissant from?", a: "France (though it evolved from the Austrian kipferl)" },
    { c: "🍔 Food", q: "What insect makes honey?", a: "Bees" },
    { c: "🍔 Food", q: "What's the most stolen food in the world?", a: "Cheese" },
    { c: "🍔 Food", q: "In the 1830s, ketchup was sold as what?", a: "Medicine" },
    { c: "🍔 Food", q: "What grain is most bread made from?", a: "Wheat" },
    { c: "🍔 Food", q: "Which province makes about 90% of Canada's maple syrup?", a: "Quebec" },
    { c: "🍔 Food", q: "What are Tim Hortons' donut holes called?", a: "Timbits" },
    { c: "🍔 Food", q: "What vegetable are pickles made from?", a: "Cucumbers" },
  ];
  const TRIVIA_CATS = ["All", ...new Set(TRIVIA.map((t) => t.c))];

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- state ----------
  const MODES = [["solo", "🧍 Solo"], ["copilot", "🧑‍✈️ Co-pilot"], ["family", "👨‍👩‍👧 Family"]];
  const FAMILY_PACKING = ["Car seats / boosters", "Tablets + chargers", "Kids' headphones", "Wet wipes ×2", "Emergency snacks", "Change of clothes per kid", "Favourite stuffed animal", "Travel games / colouring", "Sunscreen", "Motion-sickness bags"];

  function newTrip(name) {
    return { id: uid(), name: name || "My Trip", start: "", mode: "copilot", stops: [], expenses: [], travelers: [], payerId: null, people: 2, createdAt: Date.now() };
  }
  function defaults() {
    const t = newTrip("My Trip");
    return { v: 2, trips: [t], currentTripId: t.id, packing: DEFAULT_PACKING, plates: [], catIdx: 0, platesCanada: false, bingoCard: null, bingoMarked: [], q20: 0, triviaSeen: [], triviaCat: "All" };
  }
  /* v1 stored a single implicit trip at the top level — wrap it into trips[] */
  function migrate(s) {
    if (!s || typeof s !== "object") return defaults();
    if (s.v === 2 && Array.isArray(s.trips) && s.trips.length) {
      const merged = { ...defaults(), ...s };
      if (!merged.trips.some((t) => t.id === merged.currentTripId)) merged.currentTripId = merged.trips[0].id;
      merged.trips.forEach((t) => { if (!t.mode) t.mode = "copilot"; });
      return merged;
    }
    const out = { ...defaults(), packing: s.packing || DEFAULT_PACKING, plates: s.plates || [], catIdx: s.catIdx || 0, platesCanada: !!s.platesCanada, bingoCard: s.bingoCard || null, bingoMarked: s.bingoMarked || [], q20: s.q20 || 0, triviaSeen: s.triviaSeen || [], triviaCat: s.triviaCat || "All" };
    const t = out.trips[0];
    t.stops = s.stops || [];
    t.expenses = s.expenses || [];
    t.travelers = s.travelers || [];
    t.payerId = s.payerId ?? null;
    t.people = s.people || 2;
    return out;
  }
  let state = load();
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return migrate(JSON.parse(raw));
    } catch (e) { /* corrupted state — start fresh */ }
    return defaults();
  }
  function trip() {
    return state.trips.find((t) => t.id === state.currentTripId) || state.trips[0];
  }
  function soloMode() {
    return trip().mode === "solo";
  }
  /* Family trips get an extra expense category; the base list stays fixed so gas is always cats()[0]. */
  function cats() {
    return trip().mode === "family" ? [...CATEGORIES, "🧸 Kids"] : CATEGORIES;
  }
  function seedFamilyPacking() {
    if (state.packing.some((p) => p.group === "Kids")) return;
    FAMILY_PACKING.forEach((name) => state.packing.push({ id: uid(), name, group: "Kids", checked: false }));
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked */ }
    try {
      const t = trip();
      window.webkit.messageHandlers.stateSync.postMessage(JSON.stringify({
        trip: t.name,
        stops: t.stops.map((s) => ({ name: s.name, note: s.note || "", done: !!s.done })),
      }));
    } catch (e) { /* not running in the iOS wrapper */ }
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

  /* Apple devices get Apple Maps links (opens the native app); everyone else gets Google. */
  function mapsUrl(query) {
    const apple = /iPhone|iPad|Macintosh/i.test(navigator.userAgent);
    return (apple ? "https://maps.apple.com/?q=" : "https://maps.google.com/?q=") + encodeURIComponent(query);
  }

  // ---------- trip ----------
  function countdownText(t) {
    if (!t.start) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((new Date(t.start + "T00:00:00") - today) / 86400000);
    if (diff > 1) return `${diff} days to go`;
    if (diff === 1) return "Trip starts tomorrow!";
    if (diff === 0) return "Day 1 🎉";
    return `Day ${1 - diff}`;
  }
  function renderTripMeta() {
    const t = trip();
    $("#trip-name").value = t.name;
    $("#trip-start").value = t.start || "";
    const chips = $("#trip-chips");
    chips.innerHTML = "";
    state.trips.forEach((tr) => {
      const chip = button("chip" + (tr.id === t.id ? " active" : ""), tr.name, () => {
        state.currentTripId = tr.id;
        editing = null;
        save();
        renderAll();
      });
      chips.append(chip);
    });
    const add = button("chip", "+ New trip", () => {
      const nt = newTrip("Trip " + (state.trips.length + 1));
      state.trips.push(nt);
      state.currentTripId = nt.id;
      editing = null;
      save();
      renderAll();
      $("#trip-name").focus();
      $("#trip-name").select();
    });
    chips.append(add);
    $("#trip-delete").hidden = state.trips.length < 2;

    const modes = $("#trip-modes");
    modes.innerHTML = "";
    MODES.forEach(([key, label]) => {
      const chip = button("chip" + (t.mode === key ? " active" : ""), label, () => {
        trip().mode = key;
        if (key === "family") seedFamilyPacking();
        if (state.catIdx >= cats().length) state.catIdx = 0;
        save();
        renderAll();
      });
      modes.append(chip);
    });
  }
  /* Modes only hide or emphasize — no data is changed by switching. */
  function applyMode() {
    const solo = soloMode();
    document.body.classList.toggle("mode-solo", solo);
    document.querySelector(".travelers-card").hidden = solo;
    $("#game-prompts").hidden = solo;
    $("#game-bingo").hidden = solo;
    $("#game-q20").hidden = solo;
    $("#view-games").classList.toggle("family-order", trip().mode === "family");
  }
  $("#trip-name").addEventListener("input", () => {
    const name = $("#trip-name").value.trim();
    if (name) { trip().name = name; save(); }
  });
  $("#trip-name").addEventListener("blur", () => { renderTripMeta(); renderTrip(); });
  $("#trip-start").addEventListener("change", () => {
    trip().start = $("#trip-start").value;
    save();
    renderTrip();
  });
  $("#trip-delete").addEventListener("click", () => {
    if (state.trips.length < 2) return;
    if (!confirm(`Delete "${trip().name}" and all its stops and expenses?`)) return;
    state.trips = state.trips.filter((t) => t.id !== trip().id);
    state.currentTripId = state.trips[0].id;
    editing = null;
    save();
    renderAll();
  });

  function renderTrip() {
    const list = $("#stop-list");
    list.innerHTML = "";
    const stops = trip().stops;
    $("#trip-empty").hidden = stops.length > 0;
    $("#trip-progress").hidden = stops.length === 0;
    const done = stops.filter((s) => s.done).length;
    if (stops.length) {
      $("#trip-progress-fill").style.width = (done / stops.length) * 100 + "%";
      $("#trip-progress-label").textContent = `${done}/${stops.length} stops`;
    }
    const headerParts = [];
    const cd = countdownText(trip());
    if (cd) headerParts.push(cd);
    if (stops.length) headerParts.push(`${stops.length - done} stops to go`);
    $("#header-sub").textContent = headerParts.join(" · ");
    $("#driver-enter").hidden = stops.length === 0;

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
      map.href = mapsUrl(stop.name);
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
    trip().stops.push({ id: uid(), name, note: $("#stop-note").value.trim(), done: false });
    e.target.reset();
    save();
    renderTrip();
  });

  // ---------- driver mode ----------
  const driverEl = $("#driver-mode");
  let wakeLock = null;
  async function acquireWakeLock() {
    try { wakeLock = await navigator.wakeLock.request("screen"); } catch (e) { /* unsupported — native bridge covers the iOS app */ }
  }
  function setNativeKeepAwake(on) {
    try { window.webkit.messageHandlers.keepAwake.postMessage(on); } catch (e) { /* not running in the iOS wrapper */ }
  }
  function nextStop() {
    return trip().stops.find((s) => !s.done) || null;
  }
  function renderDriver() {
    const stop = nextStop();
    const done = trip().stops.filter((s) => s.done).length;
    if (!stop) {
      $("#driver-stop").textContent = trip().stops.length ? "That's the trip! 🎉" : "No stops planned";
      $("#driver-note").textContent = "";
      $("#driver-progress").textContent = trip().stops.length ? `All ${trip().stops.length} stops done` : "";
      $("#driver-nav").hidden = true;
      $("#driver-arrived").hidden = true;
      return;
    }
    $("#driver-stop").textContent = stop.name;
    $("#driver-note").textContent = stop.note || "";
    $("#driver-progress").textContent = `Stop ${done + 1} of ${trip().stops.length}`;
    $("#driver-nav").hidden = false;
    $("#driver-nav").href = mapsUrl(stop.name);
    $("#driver-arrived").hidden = false;
  }
  $("#driver-enter").addEventListener("click", () => {
    driverEl.hidden = false;
    renderDriver();
    acquireWakeLock();
    setNativeKeepAwake(true);
  });
  $("#driver-exit").addEventListener("click", () => {
    driverEl.hidden = true;
    if (wakeLock) { wakeLock.release(); wakeLock = null; }
    setNativeKeepAwake(false);
  });
  $("#driver-arrived").addEventListener("click", () => {
    const stop = nextStop();
    if (!stop) return;
    stop.done = true;
    save();
    renderTrip();
    renderDriver();
  });
  /* the OS silently drops wake locks when the app is backgrounded — re-grab on return */
  document.addEventListener("visibilitychange", () => {
    if (!driverEl.hidden && document.visibilityState === "visible") acquireWakeLock();
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
    return trip().travelers.find((t) => t.id === id) || null;
  }
  function renderTravelers() {
    const row = $("#traveler-chips");
    row.innerHTML = "";
    trip().travelers.forEach((t) => {
      const chip = button("chip", t.name + " ✕", () => {
        trip().travelers = trip().travelers.filter((x) => x.id !== t.id);
        if (trip().payerId === t.id) trip().payerId = null;
        save();
        renderTravelers();
        renderPayerChips();
        renderExpenses();
      });
      chip.setAttribute("aria-label", "remove " + t.name);
      row.append(chip);
    });
    $("#traveler-empty").hidden = trip().travelers.length > 0;
  }
  $("#traveler-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#traveler-name").value.trim();
    if (!name) return;
    if (trip().travelers.some((t) => t.name.toLowerCase() === name.toLowerCase())) return;
    trip().travelers.push({ id: uid(), name });
    e.target.reset();
    save();
    renderTravelers();
    renderPayerChips();
    renderExpenses();
  });

  function currentPayerId() {
    if (soloMode() || trip().travelers.length < 2) return null;
    if (travelerById(trip().payerId)) return trip().payerId;
    return trip().travelers[0].id;
  }
  function renderPayerChips() {
    const wrap = $("#exp-paidby");
    const hasTravelers = !soloMode() && trip().travelers.length >= 2;
    wrap.hidden = !hasTravelers;
    wrap.innerHTML = "";
    if (!hasTravelers) return;
    const label = document.createElement("span");
    label.className = "paidby-label";
    label.textContent = "Paid by";
    wrap.append(label);
    const active = currentPayerId();
    trip().travelers.forEach((t) => {
      const chip = button("chip" + (t.id === active ? " active" : ""), t.name, () => {
        trip().payerId = t.id;
        save();
        renderPayerChips();
      });
      wrap.append(chip);
    });
  }

  // ---------- expenses ----------
  function computeSettleUp() {
    const travelers = trip().travelers;
    if (soloMode() || travelers.length < 2) return null;
    const ids = new Set(travelers.map((t) => t.id));
    const attributed = trip().expenses.filter((x) => x.paidBy && ids.has(x.paidBy));
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
    return { lines, unassigned: trip().expenses.length - attributed.length };
  }

  function renderCatChips() {
    const row = $("#exp-cats");
    row.innerHTML = "";
    if (state.catIdx >= cats().length) state.catIdx = 0;
    cats().forEach((cat, i) => {
      const chip = button("chip" + (i === state.catIdx ? " active" : ""), cat, () => {
        state.catIdx = i;
        save();
        renderCatChips();
      });
      chip.type = "button";
      row.append(chip);
    });
    $("#exp-fuel-row").hidden = state.catIdx !== 0;
  }

  /* Fuel stats, full-to-full: the fuel bought at a fill covers the distance
     since the previous fill, so the first fill anchors the odometer only. */
  function fuelStats() {
    const gas = CATEGORIES[0];
    const fills = trip().expenses.filter((x) => x.cat === gas && x.odo > 0).sort((a, b) => a.odo - b.odo);
    if (fills.length < 2) return null;
    const dist = fills[fills.length - 1].odo - fills[0].odo;
    if (dist <= 0) return null;
    const after = fills.slice(1);
    const litres = after.reduce((s, x) => s + (x.litres > 0 ? x.litres : 0), 0);
    const cost = after.reduce((s, x) => s + x.amount, 0);
    const withL = trip().expenses.filter((x) => x.cat === gas && x.litres > 0);
    const totL = withL.reduce((s, x) => s + x.litres, 0);
    const lPer100 = litres > 0 ? (litres / dist) * 100 : null;
    return {
      dist,
      lPer100,
      mpg: lPer100 ? 235.215 / lPer100 : null,
      costPerKm: cost / dist,
      pricePerL: totL > 0 ? withL.reduce((s, x) => s + x.amount, 0) / totL : null,
    };
  }
  function renderFuel() {
    const f = fuelStats();
    $("#fuel-card").hidden = !f;
    if (!f) return;
    $("#fuel-econ").textContent = f.lPer100 ? f.lPer100.toFixed(1) : "—";
    $("#fuel-econ-label").textContent = f.mpg ? `L/100 km (${f.mpg.toFixed(0)} mpg US)` : "L/100 km";
    $("#fuel-costkm").textContent = fmtMoney(f.costPerKm);
    $("#fuel-dist").textContent = f.dist.toLocaleString() + " km";
    $("#fuel-ppl").textContent = f.pricePerL ? fmtMoney(f.pricePerL) : "—";
  }
  function renderExpenses() {
    const list = $("#exp-list");
    list.innerHTML = "";
    const exps = trip().expenses;
    $("#exp-empty").hidden = exps.length > 0;

    const solo = soloMode();
    const hasTravelers = !solo && trip().travelers.length >= 2;
    const splitWays = hasTravelers ? trip().travelers.length : trip().people;
    const total = exps.reduce((sum, x) => sum + x.amount, 0);
    $("#exp-total").textContent = fmtMoney(total);
    $("#split-block").hidden = solo;
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
      if (!settle.lines.length && trip().expenses.length) {
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
    renderFuel();

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
        const catList = cats().includes(exp.cat) ? cats() : [...cats(), exp.cat];
        catList.forEach((c) => catSel.append(new Option(c, c)));
        catSel.value = exp.cat;
        const noteIn = editInput("text", exp.note || "", "Note (optional)");
        const odoIn = editInput("number", exp.odo || "", "Odometer (km)");
        const litresIn = editInput("number", exp.litres || "", "Litres");
        fields.append(amountIn, catSel, noteIn, odoIn, litresIn);
        let payerSel = null;
        if (trip().travelers.length >= 2) {
          payerSel = document.createElement("select");
          payerSel.append(new Option("Paid by — not set", ""));
          trip().travelers.forEach((t) => payerSel.append(new Option("Paid by " + t.name, t.id)));
          payerSel.value = travelerById(exp.paidBy) ? exp.paidBy : "";
          fields.append(payerSel);
        }
        const ok = button("mini-btn ok", "✓", () => {
          const amount = parseFloat(amountIn.value);
          if (amount > 0) exp.amount = Math.round(amount * 100) / 100;
          exp.cat = catSel.value;
          exp.note = noteIn.value.trim();
          const odo = parseFloat(odoIn.value);
          const litres = parseFloat(litresIn.value);
          if (odo > 0) exp.odo = odo; else delete exp.odo;
          if (litres > 0) exp.litres = Math.round(litres * 100) / 100; else delete exp.litres;
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
        (payer ? " · " + payer.name + " paid" : "") +
        (exp.litres > 0 ? " · " + exp.litres + " L" : "") +
        (exp.odo > 0 ? " · " + exp.odo.toLocaleString() + " km" : "");
      body.append(title, sub);
      const amount = document.createElement("span");
      amount.className = "exp-amount";
      amount.textContent = fmtMoney(exp.amount);
      const edit = button("mini-btn", "✎", () => { editing = { type: "exp", id: exp.id }; renderExpenses(); });
      edit.setAttribute("aria-label", "edit expense");
      const del = button("mini-btn danger", "✕", () => {
        trip().expenses = trip().expenses.filter((x) => x.id !== exp.id);
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
    const exp = {
      id: uid(),
      amount: Math.round(amount * 100) / 100,
      cat: cats()[state.catIdx],
      note: $("#exp-note").value.trim(),
      paidBy: currentPayerId(),
      at: Date.now(),
    };
    if (state.catIdx === 0) {
      const odo = parseFloat($("#exp-odo").value);
      const litres = parseFloat($("#exp-litres").value);
      if (odo > 0) exp.odo = odo;
      if (litres > 0) exp.litres = Math.round(litres * 100) / 100;
    }
    trip().expenses.push(exp);
    e.target.reset();
    save();
    renderExpenses();
  });
  $("#people-minus").addEventListener("click", () => {
    trip().people = Math.max(1, trip().people - 1);
    save();
    renderExpenses();
  });
  $("#people-plus").addEventListener("click", () => {
    trip().people = Math.min(20, trip().people + 1);
    save();
    renderExpenses();
  });

  // ---------- share settle-up ----------
  function summaryText() {
    const total = trip().expenses.reduce((sum, x) => sum + x.amount, 0);
    const byCat = {};
    trip().expenses.forEach((x) => { byCat[x.cat] = (byCat[x.cat] || 0) + x.amount; });
    const hasTravelers = !soloMode() && trip().travelers.length >= 2;
    const splitWays = hasTravelers ? trip().travelers.length : trip().people;
    const lines = [
      "🛣️ Road Trip Buddy — expenses",
      "Total: " + fmtMoney(total),
      ...Object.entries(byCat).map(([c, v]) => `  ${c} ${fmtMoney(v)}`),
    ];
    if (!soloMode()) lines.push(`Split ${splitWays} ways: ${fmtMoney(total / splitWays)} each`);
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

  // Road Trip Bingo
  function newBingoCard() {
    const card = shuffle(BINGO_POOL).slice(0, 24);
    card.splice(12, 0, "FREE");
    state.bingoCard = card;
    state.bingoMarked = Array(25).fill(false);
    state.bingoMarked[12] = true;
    save();
  }
  function bingoCount() {
    return BINGO_LINES.filter((line) => line.every((i) => state.bingoMarked[i])).length;
  }
  function renderBingo() {
    if (!Array.isArray(state.bingoCard) || state.bingoCard.length !== 25) newBingoCard();
    const grid = $("#bingo-grid");
    grid.innerHTML = "";
    state.bingoCard.forEach((name, i) => {
      const cell = button(
        "bingo-cell" + (i === 12 ? " free" : "") + (state.bingoMarked[i] ? " marked" : ""),
        i === 12 ? "⭐" : name,
        () => {
          if (i === 12) return;
          const before = bingoCount();
          state.bingoMarked[i] = !state.bingoMarked[i];
          save();
          renderBingo();
          if (bingoCount() > before) {
            const banner = $("#bingo-banner");
            banner.hidden = false;
            setTimeout(() => { banner.hidden = true; }, 2500);
          }
        }
      );
      grid.append(cell);
    });
    $("#bingo-count").textContent = bingoCount();
  }
  $("#bingo-new").addEventListener("click", () => { newBingoCard(); renderBingo(); });

  // 20 Questions
  function renderQ20() {
    $("#q20-status").textContent = state.q20 >= 20 ? "Out of questions — time for final guesses!" : `Question ${state.q20} of 20`;
  }
  $("#q20-plus").addEventListener("click", () => { state.q20 = Math.min(20, state.q20 + 1); save(); renderQ20(); });
  $("#q20-minus").addEventListener("click", () => { state.q20 = Math.max(0, state.q20 - 1); save(); renderQ20(); });
  $("#q20-reset").addEventListener("click", () => { state.q20 = 0; save(); renderQ20(); });

  // Trivia — category filter; no repeats until that category's pool is used up
  let triviaIdx = -1;
  function renderTriviaCats() {
    const row = $("#trivia-cats");
    row.innerHTML = "";
    TRIVIA_CATS.forEach((cat) => {
      const chip = button("chip" + (cat === state.triviaCat ? " active" : ""), cat, () => {
        state.triviaCat = cat;
        save();
        renderTriviaCats();
      });
      row.append(chip);
    });
  }
  $("#trivia-btn").addEventListener("click", () => {
    if (!Array.isArray(state.triviaSeen)) state.triviaSeen = [];
    const pool = TRIVIA.map((_, i) => i).filter((i) => state.triviaCat === "All" || TRIVIA[i].c === state.triviaCat);
    let remaining = pool.filter((i) => !state.triviaSeen.includes(i));
    if (!remaining.length) {
      state.triviaSeen = state.triviaSeen.filter((i) => !pool.includes(i));
      remaining = pool;
    }
    triviaIdx = remaining[Math.floor(Math.random() * remaining.length)];
    state.triviaSeen.push(triviaIdx);
    save();
    $("#trivia-cat-tag").textContent = TRIVIA[triviaIdx].c;
    $("#trivia-q").textContent = TRIVIA[triviaIdx].q;
    $("#trivia-a").hidden = true;
    $("#trivia-reveal").hidden = false;
  });
  $("#trivia-reveal").addEventListener("click", () => {
    if (triviaIdx < 0) return;
    $("#trivia-a").textContent = TRIVIA[triviaIdx].a;
    $("#trivia-a").hidden = false;
    $("#trivia-reveal").hidden = true;
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
  $("#backup-export").addEventListener("click", async () => {
    const json = JSON.stringify(state, null, 2);
    const name = "road-trip-buddy-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    const file = typeof File !== "undefined" ? new File([json], name, { type: "application/json" }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); } catch (e) { /* user cancelled the share sheet */ }
      return;
    }
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
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
      const v1 = data && Array.isArray(data.stops) && Array.isArray(data.expenses);
      const v2 = data && data.v === 2 && Array.isArray(data.trips) && data.trips.length > 0;
      if (!v1 && !v2) {
        $("#backup-status").textContent = "That file doesn't look like a Road Trip Buddy backup.";
        return;
      }
      if (!confirm("Replace everything in the app with this backup?")) return;
      state = migrate(data);
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

  /* Siri "mark arrived" can run while the page is suspended — the iOS wrapper
     queues stop names and calls this when the app returns to the foreground. */
  window.rtbApplyArrivals = (names) => {
    if (!Array.isArray(names)) return;
    names.forEach((name) => {
      const stop = trip().stops.find((s) => !s.done && s.name === name) || trip().stops.find((s) => !s.done);
      if (stop) stop.done = true;
    });
    save();
    renderTrip();
    if (!driverEl.hidden) renderDriver();
  };

  function renderAll() {
    applyMode();
    renderTripMeta();
    renderTrip();
    renderPacking();
    renderTravelers();
    renderPayerChips();
    renderCatChips();
    renderExpenses();
    renderPlates();
    renderBingo();
    renderQ20();
    renderTriviaCats();
  }
  renderAll();
  save(); // seed the native state mirror on launch

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
  }
})();
