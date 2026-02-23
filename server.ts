import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("chats.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id TEXT,
    role TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(thread_id) REFERENCES threads(id) ON DELETE CASCADE
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/threads", (req, res) => {
    const threads = db.prepare("SELECT * FROM threads ORDER BY updated_at DESC").all();
    res.json(threads);
  });

  app.post("/api/threads", (req, res) => {
    const { id, title } = req.body;
    db.prepare("INSERT INTO threads (id, title) VALUES (?, ?)").run(id, title);
    res.json({ success: true });
  });

  app.get("/api/threads/:id/messages", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC").all(req.params.id);
    res.json(messages);
  });

  app.post("/api/threads/:id/messages", (req, res) => {
    const { role, content } = req.body;
    db.prepare("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)").run(req.params.id, role, content);
    db.prepare("UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/threads/:id", (req, res) => {
    db.prepare("DELETE FROM threads WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/threads/:id", (req, res) => {
    const { title } = req.body;
    db.prepare("UPDATE threads SET title = ? WHERE id = ?").run(title, req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
