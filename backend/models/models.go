package models

import "github.com/golang-jwt/jwt/v5"

// ──────────────────────────────────────────────────────────────────────────────
// JWT Claims
// ──────────────────────────────────────────────────────────────────────────────

// Claims is the JWT payload used for authentication.
type Claims struct {
	Callsign string `json:"callsign"`
	jwt.RegisteredClaims
}

// ──────────────────────────────────────────────────────────────────────────────
// Request / Response types
// ──────────────────────────────────────────────────────────────────────────────

// LoginRequest is the payload for POST /api/auth/login.
type LoginRequest struct {
	Callsign string `json:"callsign"`
	Password string `json:"password"`
}

// RegisterRequest is the payload for POST /api/auth/register.
type RegisterRequest struct {
	Callsign string `json:"callsign"`
	Password string `json:"password"`
}

// LoginResponse is returned from POST /api/auth/login.
type LoginResponse struct {
	Success  bool   `json:"success"`
	Token    string `json:"token,omitempty"`
	Callsign string `json:"callsign,omitempty"`
	Message  string `json:"message"`
}

// ProgressResponse is returned from GET /api/progress.
type ProgressResponse struct {
	Success      bool   `json:"success"`
	Callsign     string `json:"callsign,omitempty"`
	CurrentLevel int    `json:"currentLevel"`
	TotalPoints  int    `json:"totalPoints"`
	Message      string `json:"message,omitempty"`
}

// VerifyRequest is the payload for POST /api/verify.
type VerifyRequest struct {
	Flag       string `json:"flag"`
	LevelIndex int    `json:"levelIndex"`
}

// VerifyResponse is returned from POST /api/verify.
type VerifyResponse struct {
	Success      bool   `json:"success"`
	Message      string `json:"message"`
	CurrentLevel int    `json:"currentLevel,omitempty"`
	TotalPoints  int    `json:"totalPoints,omitempty"`
	Points       int    `json:"points,omitempty"`
}

// LeaderboardEntry is a single row in the leaderboard.
type LeaderboardEntry struct {
	Rank         int    `json:"rank"`
	Callsign     string `json:"callsign"`
	Points       int    `json:"points"`
	CurrentLevel int    `json:"currentLevel"`
}


// ErrorResponse is a generic error payload.
type ErrorResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}
