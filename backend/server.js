// Simple notes REST API using a JSON file as storage.
// Run: node server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const NOTES_FILE = path.join(__dirname, "notes.json");

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json()); // parse JSON bodies

// Utility: load notes from file (returns array)
async function loadNotes() {
  try {
    const data = await fs.readFile(NOTES_FILE, "utf8");
    const notes = JSON.parse(data);
    if (!Array.isArray(notes)) return [];
    return notes;
  } catch (err) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

//waxaan ku daray comments
// Utility: save notes array to file
async function saveNotes(notes) {
  await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2), "utf8");
}

// Utility: generate a simple unique id
function generateId() {
  // timestamp + random -> safe enough for small apps
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Initialize notes file if it doesn't exist
async function initializeNotesFile() {
  try {
    await fs.access(NOTES_FILE);
  } catch (err) {
    // File doesn't exist, create it with sample data
    const initialNotes = [
      {
        id: "sample-1",
        title: "Welcome to Notes App",
        content: "This is a simple notes application. You can create, edit, and delete notes.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "sample-2",
        title: "Getting Started",
        content: "Click on 'New Note' to create your first note. Use the edit and delete buttons to manage your notes.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    await saveNotes(initialNotes);
    console.log("Created new notes.json file with sample data");
  }
}

// Load notes into memory at server start (optional cache)
let notesCache = [];
(async () => {
  await initializeNotesFile();
  notesCache = await loadNotes();
  // Make sure notesCache is an array
  if (!Array.isArray(notesCache)) notesCache = [];
  console.log(`Loaded ${notesCache.length} notes from ${NOTES_FILE}`);
})();

// Routes

// GET /api/notes -> return all notes
app.get("/api/notes", async (req, res) => {
  // Always read latest from disk to be safe (ensures persistence across restarts)
  try {
    notesCache = await loadNotes();
    res.json(notesCache);
  } catch (err) {
    console.error("Error loading notes:", err);
    res.status(500).json({ error: "Failed to load notes" });
  }
});

// POST /api/notes -> create a new note
app.post("/api/notes", async (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ error: "title and content are required" });
  }

  const now = new Date().toISOString();
  const newNote = {
    id: generateId(),
    title: String(title),
    content: String(content),
    createdAt: now,
    updatedAt: now,
  };

  try {
    notesCache = await loadNotes();
    notesCache.push(newNote);
    await saveNotes(notesCache);
    res.status(201).json(newNote);
  } catch (err) {
    console.error("Error saving notes:", err);
    res.status(500).json({ error: "Failed to save note" });
  }
});

// PUT /api/notes/:id -> update a note by ID
app.put("/api/notes/:id", async (req, res) => {
  const id = req.params.id;
  const { title, content } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ error: "title and content are required" });
  }

  try {
    notesCache = await loadNotes();
    const idx = notesCache.findIndex((n) => n.id === id);
    if (idx === -1) return res.status(404).json({ error: "Note not found" });

    notesCache[idx] = {
      ...notesCache[idx],
      title: String(title),
      content: String(content),
      updatedAt: new Date().toISOString(),
    };

    await saveNotes(notesCache);
    res.json(notesCache[idx]);
  } catch (err) {
    console.error("Error saving notes:", err);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// DELETE /api/notes/:id -> delete a note by ID
app.delete("/api/notes/:id", async (req, res) => {
  const id = req.params.id;
  
  try {
    notesCache = await loadNotes();
    const idx = notesCache.findIndex((n) => n.id === id);
    if (idx === -1) return res.status(404).json({ error: "Note not found" });

    const removed = notesCache.splice(idx, 1)[0];
    await saveNotes(notesCache);
    res.json({ success: true, removed });
  } catch (err) {
    console.error("Error saving notes:", err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Notes API server running on http://localhost:${PORT}`);
});