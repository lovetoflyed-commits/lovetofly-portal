CREATE TABLE IF NOT EXISTS admin_tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  due_date DATE,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_task_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES admin_tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_task_assignments_unique
  ON admin_task_assignments(task_id, user_id);

CREATE INDEX IF NOT EXISTS admin_task_assignments_user_id_idx
  ON admin_task_assignments(user_id);

CREATE TABLE IF NOT EXISTS admin_task_checklist_items (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES admin_tasks(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_task_checklist_task_idx
  ON admin_task_checklist_items(task_id);

CREATE TABLE IF NOT EXISTS admin_task_events (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES admin_tasks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_task_events_task_idx
  ON admin_task_events(task_id);

CREATE INDEX IF NOT EXISTS admin_tasks_status_idx
  ON admin_tasks(status);

CREATE INDEX IF NOT EXISTS admin_tasks_due_date_idx
  ON admin_tasks(due_date);
