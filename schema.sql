-- Run once in Cloudflare D1's SQL console, then bind this database to Pages as "DB".
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  organizer TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  join_title TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL DEFAULT '',
  show_results INTEGER NOT NULL DEFAULT 1,
  currency TEXT NOT NULL DEFAULT 'CHF',
  program_json TEXT NOT NULL DEFAULT '[]',
  options_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
  admin_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  votes_json TEXT NOT NULL,
  respondent_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_responses_event ON responses(event_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_edit ON responses(event_id, respondent_hash);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_event ON messages(event_id);
