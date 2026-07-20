PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS contributions (
  id TEXT PRIMARY KEY,
  maya_text TEXT NOT NULL CHECK (length(maya_text) BETWEEN 1 AND 2000),
  spanish_translation TEXT NOT NULL CHECK (length(spanish_translation) BETWEEN 1 AND 2000),
  audio_key TEXT UNIQUE,
  contributor_name TEXT NOT NULL CHECK (length(contributor_name) BETWEEN 1 AND 120),
  consent_given INTEGER NOT NULL DEFAULT 0 CHECK (consent_given IN (0, 1)),
  consent_scope TEXT,
  license_code TEXT,
  governance_label TEXT,
  dialect TEXT NOT NULL CHECK (dialect IN ('oriente', 'noroccidente', 'centro', 'sur', 'costa', 'otro')),
  source TEXT NOT NULL CHECK (source IN ('hablante_nativo', 'estudiante', 'academico', 'evento', 'otro')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contributions_status_created
  ON contributions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contributions_status_dialect_created
  ON contributions(status, dialect, created_at DESC);

CREATE TRIGGER IF NOT EXISTS contributions_set_updated_at
AFTER UPDATE ON contributions
FOR EACH ROW
BEGIN
  UPDATE contributions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS speaker_interests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  phone TEXT NOT NULL CHECK (length(phone) BETWEEN 10 AND 20),
  email TEXT CHECK (email IS NULL OR length(email) <= 254),
  dialect TEXT CHECK (dialect IS NULL OR dialect IN ('oriente', 'noroccidente', 'centro', 'sur', 'costa', 'otro')),
  is_native_speaker INTEGER NOT NULL DEFAULT 0 CHECK (is_native_speaker IN (0, 1)),
  wants_to_validate INTEGER NOT NULL DEFAULT 0 CHECK (wants_to_validate IN (0, 1)),
  message TEXT CHECK (message IS NULL OR length(message) <= 2000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_speaker_interests_created
  ON speaker_interests(created_at DESC);

CREATE TABLE IF NOT EXISTS ally_interests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  phone TEXT CHECK (phone IS NULL OR length(phone) BETWEEN 10 AND 20),
  organization TEXT CHECK (organization IS NULL OR length(organization) <= 200),
  message TEXT CHECK (message IS NULL OR length(message) <= 2000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ally_interests_created
  ON ally_interests(created_at DESC);

CREATE TABLE IF NOT EXISTS ally_roles (
  ally_id TEXT NOT NULL REFERENCES ally_interests(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('desarrollo', 'diseño', 'api_datos', 'donacion', 'institucion_educativa', 'otro')),
  PRIMARY KEY (ally_id, role)
);

CREATE TABLE IF NOT EXISTS validators (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS validation_votes (
  id TEXT PRIMARY KEY,
  contribution_id TEXT NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
  validator_id TEXT NOT NULL REFERENCES validators(id) ON DELETE RESTRICT,
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject', 'abstain')),
  rationale TEXT CHECK (rationale IS NULL OR length(rationale) <= 2000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (contribution_id, validator_id)
);

CREATE INDEX IF NOT EXISTS idx_validation_votes_contribution
  ON validation_votes(contribution_id, vote);
