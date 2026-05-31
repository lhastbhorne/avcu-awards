const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   ADMIN LOGIN
========================= */
app.post("/admin-login", (req, res) => {
  const { password } = req.body;

  const ADMIN_PASSWORD = "AVCU2026";

  if (password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
    });
  }

  res.status(401).json({
    success: false,
  });
});

app.post("/clear-votes", (req, res) => {
  try {
    saveVotes([]); // empties voters.json
    res.json({ message: "All votes cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear votes" });
  }
});

const FILE = "voters.json";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* =========================
   LOAD VOTES FROM FILE
========================= */
function loadVotes() {
  try {
    const data = fs.readFileSync(FILE);
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

/* =========================
   SAVE VOTES TO FILE
========================= */
function saveVotes(votes) {
  fs.writeFileSync(FILE, JSON.stringify(votes, null, 2));
}

/* =========================
   GET ALL VOTES (ADMIN)
========================= */
app.get("/votes", (req, res) => {
  const votes = loadVotes();
  res.json(votes);
});

/* =========================
   SUBMIT VOTE (VOTER)
========================= */
app.post("/vote", upload.single("receipt"), (req, res) => {
  const votes = loadVotes();

  const newVote = {
    id: Date.now(),
    name: req.body.name,
    phone: req.body.phone,
    category: req.body.category,
    nominee: req.body.nominee,
    votesCount: req.body.votesCount,
    transaction: req.body.transaction,
    receipt: req.file ? req.file.filename : null,
    status: "pending",
  };

  votes.push(newVote);
  saveVotes(votes);

  res.json({ message: "Vote submitted" });
});

/* =========================
   APPROVE
========================= */
app.post("/approve/:id", (req, res) => {
  let votes = loadVotes();

  votes = votes.map((v) =>
    v.id == req.params.id ? { ...v, status: "approved" } : v,
  );

  saveVotes(votes);
  res.json({ message: "approved" });
});

/* =========================
   REJECT
========================= */
app.post("/reject/:id", (req, res) => {
  let votes = loadVotes();

  votes = votes.map((v) =>
    v.id == req.params.id ? { ...v, status: "rejected" } : v,
  );

  saveVotes(votes);
  res.json({ message: "rejected" });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
