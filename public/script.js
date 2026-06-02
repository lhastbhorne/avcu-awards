const category = document.getElementById("category");
const nominee = document.getElementById("nominee");
const form = document.getElementById("voteForm");
const votes = document.getElementById("votes");
const transactionInput = document.getElementById("transactionInput");
const amountDisplay = document.getElementById("amountDisplay");
const button = form.querySelector("button[type='submit']");

let votingClosed = false;
let cooldown = false;

let usedTransactions =
  JSON.parse(localStorage.getItem("usedTransactions")) || {};

const data = {
  "Most punctual member": [
    "Sister Feranmi",
    "Sister Odunola",
    "Sister Ebunoluwa",
  ],
  "Most reserved member": [
    "Sister God'glory",
    "Bro. Diamond Samuel",
    "Sister Tobiloba",
  ],
  "Best dancer": ["Bro. Henry", "Bro. Ezekiel", "Sister Priscilla"],
  "Best dressed - female": ["Sister Nifemi", "Sister Ayomide", "Sister Faith"],
  "Best dressed - male": ["Bro. Ojo Paul", "Bro. Ayomide", "Bro. Blessed"],
  "Entrepreneur of the year": ["Henry Spice", "IK Shot It"],
  "Most popular female": ["Sister Ike", "Sister Queen", "Sister Abigail"],
  "Most popular male": ["Bro. Ezekiel", "Bro. Emmanuel", "Bro. Blessing"],
  "Most welcoming usher": ["Sister Evidence", "Bro. Peter", "Sister Favour"],
  "Executive of the year": ["Sister Queen", "Bro. David", "Bro. Kelvin"],
  "Most outspoken": ["Bro. Kolade", "Sister Ayomide", "Bro. Blessing"],
  "Mr. AVCU": ["Bro. Blessed", "Bro. Wisdom"],
  "Miss AVCU": ["Sister Dorinda", "Sister Evidence"],
};

category.addEventListener("change", () => {
  nominee.innerHTML = '<option value="">Select Nominee</option>';

  const list = data[category.value];
  if (!list) return;

  list.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    nominee.appendChild(opt);
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (votingClosed) return alert("Voting is closed.");
  if (cooldown) return alert("Please wait before voting again.");

  const fullName = document.getElementById("fullName").value;
  const phone = document.getElementById("phoneNumber").value;
  const transaction = transactionInput.value.trim();
  const voteCount = Number(votes.value);
  const receiptFile = document.getElementById("receipt").files[0];

  if (!fullName || !phone) return alert("Enter name and phone.");
  if (transaction.length < 8) return alert("Invalid transaction number.");
  if (usedTransactions[transaction]) return alert("Transaction already used.");
  if (!nominee.value || voteCount <= 0) return alert("Complete all fields.");
  if (!receiptFile) return alert("Please upload receipt.");

  /* =========================
     FORM DATA (IMPORTANT FIX)
  ========================= */
  const formData = new FormData();
  formData.append("name", fullName);
  formData.append("phone", phone);
  formData.append("category", category.value);
  formData.append("nominee", nominee.value);
  formData.append("votesCount", voteCount);
  formData.append("transaction", transaction);
  formData.append("receipt", receiptFile);

  try {
    const res = await fetch("/vote", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();

    if (res.ok) {
      usedTransactions[transaction] = true;
      localStorage.setItem(
        "usedTransactions",
        JSON.stringify(usedTransactions),
      );

      document.getElementById("successModal").style.display = "flex";

      setTimeout(() => {
        closeModal();
      }, 3000);

      form.reset();
      amountDisplay.textContent = "Total Amount: ₦0";

    } else {
      alert(result.message || "Error submitting vote");
    }
  } catch (err) {
    console.error(err);
    alert("Server not running or connection error");
  }

  cooldown = true;
  setTimeout(() => (cooldown = false), 15000);

  button.disabled = true;
  button.textContent = "Submitting...";

  setTimeout(() => {
    button.disabled = false;
    button.textContent = "Submit Vote";
  }, 1000);
});

function closeModal() {
  document.getElementById("successModal").style.display = "none";
}
