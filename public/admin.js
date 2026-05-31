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
   FETCH FROM SERVER
========================= */
async function fetchVotes() {
  try {
    const res = await fetch("/votes");
    allVotes = await res.json();

    renderVotes();
    updateStats();
  } catch (err) {
    console.error("Server error:", err);
  }
}

async function clearVotes() {
  const confirmClear = confirm("Are you sure you want to delete ALL votes?");

  if (!confirmClear) return;

  try {
    const res = await fetch("/clear-votes", {
      method: "POST",
    });

    const data = await res.json();

    alert(data.message);

    // refresh dashboard
    fetchVotes();
  } catch (err) {
    console.error(err);
    alert("Failed to clear votes");
  }
}

/* =========================
   RENDER
========================= */
function renderVotes() {
  if (!Array.isArray(allVotes)) return;
  const filter = filterStatus.value;
  votesContainer.innerHTML = "";

  let filtered = allVotes;

  if (filter !== "all") {
    filtered = allVotes.filter((v) => v.status === filter);
  }

  if (filtered.length === 0) {
    votesContainer.innerHTML = "<p>No votes found.</p>";
    return;
  }

  filtered.forEach((vote) => {
    const div = document.createElement("div");
    div.classList.add("vote-card");

    div.innerHTML = `
      <p><b>Name:</b> ${vote.name}</p>
      <p><b>Phone:</b> ${vote.phone}</p>
      <p><b>Category:</b> ${vote.category}</p>
      <p><b>Nominee:</b> ${vote.nominee}</p>
      <p><b>Votes:</b> ${vote.votesCount}</p>

     ${
       vote.receipt
         ? `
  ${
    vote.receipt?.toLowerCase().includes(".pdf")
      ? `<a href="/uploads/${vote.receipt}" target="_blank">
          📄 View PDF Receipt
        </a>`
      : `<img src="/uploads/${vote.receipt}" width="150" style="border-radius:10px;">`
  }
`
         : ""
     }

      <span class="status ${vote.status}">
        ${vote.status.toUpperCase()}
      </span>

      <div class="admin-buttons">
        <button onclick="approveVote(${vote.id})">Approve</button>
        <button onclick="rejectVote(${vote.id})">Reject</button>
      </div>
    `;

    votesContainer.appendChild(div);
  });
}

/* =========================
   APPROVE
========================= */
async function approveVote(id) {
  await fetch(`/approve/${id}`, {
    method: "POST",
  });

  await fetchVotes();
}

/* =========================
   REJECT
========================= */
async function rejectVote(id) {
  await fetch(`/reject/${id}`, {
    method: "POST",
  });

  await fetchVotes();
}

/* =========================
   STATS
========================= */
function updateStats() {
  const total = allVotes.length;
  const pending = allVotes.filter((v) => v.status === "pending").length;
  const approved = allVotes.filter((v) => v.status === "approved").length;
  const rejected = allVotes.filter((v) => v.status === "rejected").length;

  totalVotesEl.textContent = total;
  pendingVotesEl.textContent = pending;
  approvedVotesEl.textContent = approved;
  rejectedVotesEl.textContent = rejected;
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
