if (localStorage.getItem("adminLoggedIn") !== "true") {
  window.location.href = "login.html";
}

const votesContainer = document.getElementById("votesContainer");
const filterStatus = document.getElementById("filterStatus");

const totalVotesEl = document.getElementById("totalVotes");
const pendingVotesEl = document.getElementById("pendingVotes");
const approvedVotesEl = document.getElementById("approvedVotes");
const rejectedVotesEl = document.getElementById("rejectedVotes");

let allVotes = [];

/* =========================
   FETCH
========================= */
async function fetchVotes() {
  const res = await fetch("/votes");
  allVotes = await res.json();

  renderVotes();
  updateStats();
  renderLeaderboard();
}

/* =========================
   RENDER VOTES (PENDING FIRST)
========================= */
function renderVotes() {
  votesContainer.innerHTML = "";

  let filter = filterStatus.value;

  let filtered = allVotes;

  if (filter !== "all") {
    filtered = allVotes.filter(v => v.status === filter);
  }

  // ⭐ SORT: pending FIRST
  filtered.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return 0;
  });

  if (filtered.length === 0) {
    votesContainer.innerHTML = "<p>No votes found.</p>";
    return;
  }

  filtered.forEach(vote => {
    const div = document.createElement("div");
    div.className = "vote-card";

    const isPending = vote.status === "pending";

    div.innerHTML = `
      <p><b>Name:</b> ${vote.name}</p>
      <p><b>Category:</b> ${vote.category}</p>
      <p><b>Nominee:</b> ${vote.nominee}</p>
      <p><b>Votes:</b> ${vote.votesCount}</p>

      <span class="status ${vote.status}">
        ${vote.status.toUpperCase()}
      </span>

      <div class="admin-buttons">
        ${
          isPending
            ? `
              <button class="approve-btn" onclick="approveVote(${vote.id})">Approve</button>
              <button class="reject-btn" onclick="rejectVote(${vote.id})">Reject</button>
            `
            : `
              <button onclick="deleteVote(${vote.id})" style="background:black;color:white;">
                Delete
              </button>
            `
        }
      </div>
    `;

    votesContainer.appendChild(div);
  });
}

/* =========================
   APPROVE / REJECT
========================= */
async function approveVote(id) {
  await fetch(`/approve/${id}`, { method: "POST" });
  fetchVotes();
}

async function rejectVote(id) {
  await fetch(`/reject/${id}`, { method: "POST" });
  fetchVotes();
}

/* =========================
   DELETE (NEW)
========================= */
async function deleteVote(id) {
  if (!confirm("Delete this vote permanently?")) return;

  await fetch(`/delete/${id}`, { method: "POST" });

  fetchVotes();
}

/* =========================
   STATS
========================= */
function updateStats() {
  totalVotesEl.textContent = allVotes.length;
  pendingVotesEl.textContent = allVotes.filter(v => v.status === "pending").length;
  approvedVotesEl.textContent = allVotes.filter(v => v.status === "approved").length;
  rejectedVotesEl.textContent = allVotes.filter(v => v.status === "rejected").length;
}

/* =========================
   LEADERBOARD (ADMIN VERSION)
   - shows ALL nominees per category
   - shows leader clearly
========================= */
function renderLeaderboard() {
  const container = document.getElementById("leaderboardAdmin");

  if (!container) return;

  const approved = allVotes.filter(v => v.status === "approved");

  const grouped = {};

  approved.forEach(v => {
    const key = v.category + "-" + v.nominee;

    if (!grouped[key]) {
      grouped[key] = {
        category: v.category,
        nominee: v.nominee,
        votes: 0
      };
    }

    grouped[key].votes += Number(v.votesCount);
  });

  const list = Object.values(grouped);

  const byCategory = {};

  list.forEach(item => {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  });

  container.innerHTML = "";

  Object.keys(byCategory).forEach(cat => {
    const items = byCategory[cat];

    // sort winners first
    items.sort((a, b) => b.votes - a.votes);

    const categoryDiv = document.createElement("div");
    categoryDiv.className = "vote-card";

    categoryDiv.innerHTML = `
      <h3 style="color:gold">${cat}</h3>
      ${items
        .map((i, index) => {
          return `
            <p>
              ${index === 0 ? "🏆" : ""} 
              <b>${i.nominee}</b> — ${i.votes} votes
            </p>
          `;
        })
        .join("")}
    `;

    container.appendChild(categoryDiv);
  });
}

/* =========================
   FILTER
========================= */
filterStatus.addEventListener("change", renderVotes);

/* =========================
   AUTO REFRESH
========================= */
setInterval(fetchVotes, 3000);

/* INIT */
fetchVotes();

function logout() {
  localStorage.removeItem("adminLoggedIn");
  window.location.href = "login.html";
}