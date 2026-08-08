package config

import "os"

var (
	JWTSecret  = []byte(getEnvOrDefault("JWT_SECRET", "wargame-ctf-secret-change-me-in-prod"))
	ListenAddr = getEnvOrDefault("LISTEN_ADDR", ":8081")
	DBPath     = getEnvOrDefault("DB_PATH", "./wargame.db")
)

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
