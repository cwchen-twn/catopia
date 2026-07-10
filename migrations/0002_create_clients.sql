-- Migration number: 0002 	 2026-07-10T14:42:45.573Z

CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'lead' CHECK (
    status IN ('lead', 'active', 'closed_won', 'closed_lost', 'closed_abandoned')
  ),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Backfill existing submitters as 'lead' (safe default — doesn't trigger confirmation).
-- The WHERE is required: SQLite's grammar for INSERT...SELECT...FROM followed by an
-- upsert clause is ambiguous without one, even a trivial always-true condition.
INSERT INTO clients (email)
SELECT DISTINCT email FROM contact_submissions WHERE true
ON CONFLICT(email) DO NOTHING;
