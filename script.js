let leagueData = null;

const MY_TEAM = "Venom";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

init();

async function init() {
  const response = await fetch("data.json");
  leagueData = await response.json();

  document.getElementById("last-updated").textContent =
    `Updated ${leagueData.lastUpdated} — ${leagueData.season} season`;

  setupTabs();
  setupSortableTable("standings-table", leagueData.standings, "points", "desc");
  setupSortableTable("players-table", leagueData.players, "total", "desc");

  renderGameList();
}

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
}

// Parses "YYYY-MM-DD" as a local date instead of UTC, so games don't
// appear to land on the wrong day depending on the viewer's timezone.
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function setupSortableTable(tableId, rows, defaultKey, defaultDir, transform) {
  const table = document.getElementById(tableId);
  const tbody = table.querySelector("tbody");
  const headers = table.querySelectorAll("th");

  const data = transform ? rows.map(transform) : rows;
  let sortKey = defaultKey;
  let sortDir = defaultDir;

  function render() {
    const sorted = [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
      return sortDir === "asc" ? cmp : -cmp;
    });

    tbody.innerHTML = "";
    sorted.forEach((row) => {
      const tr = document.createElement("tr");
      headers.forEach((th) => {
        const td = document.createElement("td");
        td.textContent = row[th.dataset.key];
        if (th.dataset.key === "team" && row.team === MY_TEAM) {
          td.classList.add("my-team-name");
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    headers.forEach((th) => {
      th.classList.remove("sorted-asc", "sorted-desc");
      if (th.dataset.key === sortKey) {
        th.classList.add(sortDir === "asc" ? "sorted-asc" : "sorted-desc");
      }
    });
  }

  headers.forEach((th) => {
    th.addEventListener("click", () => {
      if (sortKey === th.dataset.key) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortKey = th.dataset.key;
        sortDir = "desc";
      }
      render();
    });
  });

  render();
}

// Converts "7:00 PM" to minutes-since-midnight so same-day games sort correctly.
function parseTimeToMinutes(timeStr) {
  const match = /(\d+):(\d+)\s*(AM|PM)/i.exec(timeStr || "");
  if (!match) return 0;
  let [, hour, minute, meridiem] = match;
  hour = Number(hour) % 12;
  if (meridiem.toUpperCase() === "PM") hour += 12;
  return hour * 60 + Number(minute);
}

function formatDateLabel(dateStr) {
  const date = parseLocalDate(dateStr);
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Deterministic placeholder color so every team gets a consistent badge
// color even before real logo files are added.
function colorForTeam(name) {
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return `hsl(${hash % 360}, 55%, 40%)`;
}

function teamBadge(name) {
  const wrapper = document.createElement("div");
  wrapper.className = "team-badge";

  const img = document.createElement("img");
  img.src = `logos/${slugify(name)}.png`;
  img.alt = `${name} logo`;
  img.className = "team-logo";
  img.onerror = () => {
    img.remove();
    const initials = document.createElement("div");
    initials.className = "team-logo team-initials";
    initials.style.background = colorForTeam(name);
    initials.textContent = name
      .split(/\s+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    wrapper.prepend(initials);
  };

  const label = document.createElement("span");
  label.className = "team-name";
  label.textContent = name;

  wrapper.appendChild(img);
  wrapper.appendChild(label);
  return wrapper;
}


function renderGameList() {
  const container = document.getElementById("game-list");
  container.innerHTML = "";

  const games = [...leagueData.schedule].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
  });

  games.forEach((game) => {
    const isFinal =
      game.homeScore != null &&
      game.awayScore != null &&
      (game.homeScore !== 0 || game.awayScore !== 0);
    const homeWon = isFinal && game.homeScore > game.awayScore;
    const awayWon = isFinal && game.awayScore > game.homeScore;

    const card = document.createElement("div");
    card.className = "game-card";

    const header = document.createElement("div");
    header.className = "game-card-header";
    header.innerHTML = `<span>${formatDateLabel(game.date)}</span><span>${game.location || ""}</span>`;
    card.appendChild(header);

    const row = document.createElement("div");
    row.className = "game-card-row";

    const awayBadge = teamBadge(game.away);
    const homeBadge = teamBadge(game.home);

    if (isFinal) {
      awayBadge.classList.add(awayWon ? "winner" : "loser");
      homeBadge.classList.add(homeWon ? "winner" : "loser");
    }

    const venomIsAway = game.away === MY_TEAM;
    const venomIsHome = game.home === MY_TEAM;
    const venomWon = (venomIsAway && awayWon) || (venomIsHome && homeWon);
    const venomBadge = `<span class="result-badge ${venomWon ? "win" : "loss"}">${venomWon ? "W" : "L"}</span>`;

    const center = document.createElement("div");
    center.className = "game-center";
    if (isFinal) {
      center.innerHTML = `
        <div class="game-status">FINAL</div>
        <div class="game-score-row">
          ${venomIsAway ? venomBadge : ""}
          <span class="game-score">${game.awayScore}-${game.homeScore}</span>
          ${venomIsHome ? venomBadge : ""}
        </div>
      `;
    } else {
      center.innerHTML = `
        <div class="game-status">UPCOMING</div>
        <div class="game-time">${game.time}</div>
      `;
    }

    row.appendChild(awayBadge);
    row.appendChild(center);
    row.appendChild(homeBadge);
    card.appendChild(row);

    container.appendChild(card);
  });
}
