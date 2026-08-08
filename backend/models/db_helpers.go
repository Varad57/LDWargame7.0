package models

import (
	"wargame-backend/database"
)

// CreatePlayer inserts a new player record into the database.
func CreatePlayer(callsign, passwordHash string) error {
	_, err := database.DB.Exec(
		`INSERT INTO players (callsign, password_hash) VALUES (?, ?)`,
		callsign, passwordHash,
	)
	return err
}

// GetPasswordHash retrieves a player's password hash by callsign.
func GetPasswordHash(callsign string) (string, error) {
	var storedHash string
	err := database.DB.QueryRow(`SELECT password_hash FROM players WHERE callsign = ?`, callsign).Scan(&storedHash)
	return storedHash, err
}

// GetPlayerProgress retrieves a player's current level and total points.
func GetPlayerProgress(callsign string) (currentLevel int, totalPoints int, err error) {
	err = database.DB.QueryRow(
		`SELECT current_level, total_points FROM players WHERE callsign = ?`,
		callsign,
	).Scan(&currentLevel, &totalPoints)
	return
}

// UpdatePlayerProgress updates a player's progress and points.
func UpdatePlayerProgress(callsign string, newLevel int, newPoints int) error {
	_, err := database.DB.Exec(
		`UPDATE players SET current_level = ?, total_points = ?, updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now') WHERE callsign = ?`,
		newLevel, newPoints, callsign,
	)
	return err
}

// GetLeaderboardWithUser retrieves the top players and ensures the given callsign is included if not in top.
func GetLeaderboardWithUser(callsign string, limit int) ([]LeaderboardEntry, error) {
	rows, err := database.DB.Query(
		`SELECT callsign, total_points, current_level FROM players ORDER BY total_points DESC, updated_at ASC, current_level DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []LeaderboardEntry
	rank := 1
	var userEntry *LeaderboardEntry

	for rows.Next() {
		var e LeaderboardEntry
		if err := rows.Scan(&e.Callsign, &e.Points, &e.CurrentLevel); err != nil {
			return nil, err
		}
		e.Rank = rank
		
		if rank <= limit {
			entries = append(entries, e)
		}
		
		if e.Callsign == callsign {
			userEntry = &e
		}

		// If we found the user and we already have the top 20, we can break early
		if rank >= limit && userEntry != nil {
			break
		}
		
		rank++
	}

	// If user was not in top limit, append them at the end
	if userEntry != nil && userEntry.Rank > limit {
		entries = append(entries, *userEntry)
	}

	return entries, nil
}
