PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,

    telegram_message_id INTEGER NOT NULL UNIQUE,

    title TEXT NOT NULL DEFAULT '',
    artist TEXT NOT NULL DEFAULT '',
    album TEXT NOT NULL DEFAULT '',

    file_name TEXT NOT NULL DEFAULT '',
    format TEXT NOT NULL DEFAULT '',
    mime_type TEXT NOT NULL DEFAULT '',

    duration INTEGER NOT NULL DEFAULT 0,
    file_size INTEGER NOT NULL DEFAULT 0,

    bitrate INTEGER NOT NULL DEFAULT 0,
    sample_rate INTEGER NOT NULL DEFAULT 0,
    channels INTEGER NOT NULL DEFAULT 0,

    is_atmos INTEGER NOT NULL DEFAULT 0,

    indexed_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tracks_title
ON tracks(title);

CREATE INDEX IF NOT EXISTS idx_tracks_artist
ON tracks(artist);

CREATE INDEX IF NOT EXISTS idx_tracks_album
ON tracks(album);

CREATE INDEX IF NOT EXISTS idx_tracks_file_name
ON tracks(file_name);

CREATE INDEX IF NOT EXISTS idx_tracks_message_id
ON tracks(telegram_message_id);

CREATE INDEX IF NOT EXISTS idx_tracks_atmos
ON tracks(is_atmos);

CREATE TABLE IF NOT EXISTS index_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO index_state
(
    key,
    value,
    updated_at
)
VALUES
(
    'last_telegram_message_id',
    '0',
    unixepoch()
);