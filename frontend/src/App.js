import React, { useEffect, useState } from "react";
import "./App.css";

/*
  Simple Notes App frontend (React).
  - Fetches notes from backend at /api/notes
  - Can create, edit, delete notes
  - Uses functional components and hooks
*/

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

// ------------------ NoteForm component ------------------
function NoteForm({
  onSave,
  initial = { title: "", content: "" },
  onCancel,
  saving,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Reset form when initial changes
  useEffect(() => {
    setTitle(initial.title || "");
    setContent(initial.content || "");
  }, [initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Title and content cannot be empty");
      return;
    }
    onSave({ title: title.trim(), content: content.trim() });
  };

  return (
    <form className="note-form" onSubmit={handleSubmit}>
   
      <input
        type="text"
        className="input-title"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className="input-content"
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={6}
      />
      <div className="form-actions">
        <button type="submit" disabled={saving} className="btn primary">
          {saving ? "Saving..." : "Save"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// ------------------ Main App component ------------------
function App() {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState(null);

  // UI state for creating / editing
  const [editingNote, setEditingNote] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load notes from backend
  const fetchNotes = async () => {
    setLoadingNotes(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/notes`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error(err);
      setError("Could not load notes. Is the backend running?");
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Create note
  const createNote = async ({ title, content }) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error ${res.status}`);
      }
      
      await fetchNotes();
      setShowCreate(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create note: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Update note
  const updateNote = async (id, { title, content }) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error ${res.status}`);
      }
      
      await fetchNotes();
      setEditingNote(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update note: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete note
  const deleteNote = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error ${res.status}`);
      }
      
      await fetchNotes();
    } catch (err) {
      console.error(err);
      alert("Failed to delete note: " + err.message);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Notes App</h1>
        <p className="subtitle">
          Create, edit, and delete notes — stored in a JSON file on the server.
        </p>
      </header>

      <main>
        <section className="controls">
          <button
            className="btn primary"
            onClick={() => {
              setShowCreate((s) => !s);
              setEditingNote(null);
            }}
          >
            {showCreate ? "Close" : "New Note"}
          </button>
          <button className="btn" onClick={fetchNotes} disabled={loadingNotes}>
            {loadingNotes ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        {error && <div className="error">{error}</div>}

        {showCreate && (
          <section className="panel">
            <h2>Create Note</h2>
            <NoteForm
              onSave={createNote}
              onCancel={() => setShowCreate(false)}
              saving={saving}
            />
          </section>
        )}

        {editingNote && (
          <section className="panel">
            <h2>Edit Note</h2>
            <NoteForm
              initial={editingNote}
              onSave={(vals) => updateNote(editingNote.id, vals)}
              onCancel={() => setEditingNote(null)}
              saving={saving}
            />
          </section>
        )}

        <section className="notes-list panel">
          <h2>All Notes</h2>
          {loadingNotes ? (
            <div className="loading">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="muted">
              No notes yet. Click "New Note" to add one.
            </div>
          ) : (
            <ul>
              {notes
                .slice()
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .map((note) => (
                  <li key={note.id} className="note-item">
                    <div className="note-main">
                      <h3 className="note-title">{note.title}</h3>
                      <p className="note-content">{note.content}</p>
                      <div className="meta">
                        <small>
                          Updated: {new Date(note.updatedAt).toLocaleString()}
                        </small>
                      </div>
                    </div>

                    <div className="note-actions">
                      <button
                        className="btn"
                        onClick={() => {
                          setEditingNote(note);
                          setShowCreate(false);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn danger"
                        onClick={() => deleteNote(note.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </main>

      <footer>
        <small>
          Notes are saved to the backend file (notes.json). Backend port: 5000
        </small>
      </footer>
    </div>
  );
}

export default App;