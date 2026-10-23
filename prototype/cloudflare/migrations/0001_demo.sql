CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_expiry ON sessions(expires_at);

CREATE TABLE profiles (
  owner TEXT PRIMARY KEY NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK(length(CAST(body AS BLOB)) <= 20000)
);
CREATE TABLE lots (
  owner TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  body TEXT NOT NULL CHECK(length(CAST(body AS BLOB)) <= 100000),
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(owner,id)
);
CREATE INDEX lots_owner_updated ON lots(owner,updated_at);
CREATE TABLE media (
  id TEXT PRIMARY KEY NOT NULL,
  owner TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  mime TEXT NOT NULL,
  byte_length INTEGER NOT NULL CHECK(byte_length BETWEEN 1 AND 2000000),
  created_at TEXT NOT NULL
);
CREATE INDEX media_owner ON media(owner);
CREATE TABLE media_chunks (
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  part INTEGER NOT NULL,
  body BLOB NOT NULL CHECK(length(body) <= 250000),
  PRIMARY KEY(media_id,part)
);

CREATE TRIGGER session_cap BEFORE INSERT ON sessions
WHEN (SELECT count(*) FROM sessions) >= 500
BEGIN SELECT RAISE(ABORT,'DEMO_LIMIT: visitor capacity reached'); END;

CREATE TRIGGER lot_cap BEFORE INSERT ON lots
WHEN NOT EXISTS(SELECT 1 FROM lots WHERE owner=NEW.owner AND id=NEW.id)
AND ((SELECT count(*) FROM lots WHERE owner=NEW.owner) >= 100 OR (SELECT count(*) FROM lots) >= 2000)
BEGIN SELECT RAISE(ABORT,'DEMO_LIMIT: lot capacity reached'); END;

CREATE TRIGGER media_cap BEFORE INSERT ON media
WHEN (SELECT count(*) FROM media WHERE owner=NEW.owner) >= 20
OR (SELECT coalesce(sum(byte_length),0) FROM media WHERE owner=NEW.owner) + NEW.byte_length > 10000000
OR (SELECT coalesce(sum(byte_length),0) FROM media) + NEW.byte_length > 64000000
BEGIN SELECT RAISE(ABORT,'DEMO_LIMIT: attachment capacity reached'); END;
