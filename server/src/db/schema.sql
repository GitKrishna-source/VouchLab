-- Database Schema for VouchLab / ShareSpace

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'owner', 'manager', 'admin')),
  category TEXT DEFAULT 'student', -- 'academic_project', 'research', 'startup_creator', 'casual'
  department TEXT,
  phone TEXT,
  verified_status INTEGER DEFAULT 1,
  avatar TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Labs', 'Equipment', 'Rooms', 'Tools', 'Others')),
  description TEXT,
  location TEXT NOT NULL,
  owner_id INTEGER REFERENCES users(id),
  manager_id INTEGER REFERENCES users(id),
  image_url TEXT,
  availability_hours TEXT, -- JSON e.g. {"days": ["Mon","Tue","Wed","Thu","Fri"], "open": "09:00", "close": "18:00"}
  rules TEXT,
  access_conditions TEXT,
  deposit INTEGER DEFAULT 0,
  max_session_hours INTEGER DEFAULT 4,
  monthly_cap_hours INTEGER DEFAULT 20,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resource_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('quiz', 'certificate', 'supervised_session', 'signoff', 'membership')),
  title TEXT NOT NULL,
  description TEXT,
  config TEXT DEFAULT '{}', -- JSON configuration
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS passports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issued_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, badge_key)
);

CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requirement_id INTEGER REFERENCES resource_requirements(id),
  file_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'rejected')),
  verified_by INTEGER REFERENCES users(id),
  verified_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
  requirement_id INTEGER REFERENCES resource_requirements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pass_percentage INTEGER DEFAULT 80,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT NOT NULL, -- JSON array of strings
  correct_option_index INTEGER NOT NULL,
  explanation TEXT
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
  score INTEGER NOT NULL,
  passed INTEGER NOT NULL CHECK(passed IN (0, 1)),
  answers TEXT, -- JSON
  attempted_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS signoffs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  requirement_id INTEGER NOT NULL REFERENCES resource_requirements(id),
  resource_id INTEGER NOT NULL REFERENCES resources(id),
  requested_at TEXT DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  approved_by INTEGER REFERENCES users(id),
  approved_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id INTEGER NOT NULL REFERENCES resources(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  purpose TEXT NOT NULL,
  project_category TEXT DEFAULT 'academic_project',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'waitlisted', 'checked_in', 'returned', 'completed', 'cancelled', 'overdue')),
  waitlist_position INTEGER DEFAULT 0,
  score REAL DEFAULT 0,
  score_breakdown TEXT, -- JSON plain language data
  decision_reason TEXT,
  override_reason TEXT,
  override_by INTEGER REFERENCES users(id),
  checked_in_at TEXT,
  returned_at TEXT,
  extension_requested_to TEXT,
  extension_status TEXT CHECK(extension_status IN ('none', 'pending', 'approved', 'rejected')) DEFAULT 'none',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS condition_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  type TEXT NOT NULL CHECK(type IN ('checkin', 'return')),
  user_id INTEGER NOT NULL REFERENCES users(id),
  is_working INTEGER NOT NULL DEFAULT 1,
  has_scratches INTEGER NOT NULL DEFAULT 0,
  missing_parts INTEGER NOT NULL DEFAULT 0,
  cleanliness INTEGER NOT NULL DEFAULT 5,
  notes TEXT,
  photos TEXT DEFAULT '[]', -- JSON array of image URLs
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER REFERENCES bookings(id),
  resource_id INTEGER NOT NULL REFERENCES resources(id),
  reported_by INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'under_review', 'resolved')),
  ai_summary TEXT,
  ai_suggested_severity TEXT,
  resolution_notes TEXT,
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TEXT,
  photos TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'danger')),
  read INTEGER DEFAULT 0,
  link TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fairness_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  w_wait REAL DEFAULT 10.0,
  w_usage REAL DEFAULT 2.0,
  bonus_academic REAL DEFAULT 30.0,
  bonus_research REAL DEFAULT 20.0,
  bonus_startup REAL DEFAULT 10.0,
  bonus_casual REAL DEFAULT 0.0,
  monthly_hour_cap REAL DEFAULT 20.0,
  cancellation_penalty_threshold INTEGER DEFAULT 3,
  cancellation_block_days INTEGER DEFAULT 7,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  actor_id INTEGER,
  actor_name TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  payload TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  hash TEXT NOT NULL
);

