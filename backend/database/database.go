package database

import (
	"database/sql"
	"log"

	"wargame-backend/config"

	_ "modernc.org/sqlite"
)

// DB is the global database connection pool.
var DB *sql.DB

// Init opens the SQLite database and creates the schema.
func Init() {
	var err error
	DB, err = sql.Open("sqlite", config.DBPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	// WAL mode for better concurrent reads
	if _, err := DB.Exec("PRAGMA journal_mode=WAL"); err != nil {
		log.Printf("Warning: could not set WAL mode: %v", err)
	}

	// Busy timeout: wait up to 5 seconds if DB is locked
	if _, err := DB.Exec("PRAGMA busy_timeout=5000"); err != nil {
		log.Printf("Warning: could not set busy_timeout: %v", err)
	}

	// Connection pool tuning for concurrency
	DB.SetMaxOpenConns(1) // SQLite only supports 1 writer at a time
	DB.SetMaxIdleConns(1)

	schema := `
	CREATE TABLE IF NOT EXISTS players (
		id            INTEGER PRIMARY KEY AUTOINCREMENT,
		callsign      TEXT    UNIQUE NOT NULL,
		password_hash TEXT    NOT NULL,
		current_level INTEGER NOT NULL DEFAULT 0,
		total_points  INTEGER NOT NULL DEFAULT 0,
		created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
		updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
	);
	CREATE INDEX IF NOT EXISTS idx_players_callsign ON players(callsign);
	CREATE INDEX IF NOT EXISTS idx_players_points ON players(total_points DESC);
	`
	if _, err := DB.Exec(schema); err != nil {
		log.Fatalf("Failed to create schema: %v", err)
	}

	log.Printf("Database initialized at %s", config.DBPath)
}

// Close cleanly shuts down the database connection.
func Close() {
	if DB != nil {
		DB.Close()
	}
}
