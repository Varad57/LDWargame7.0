package routes

import (
	"net/http"

	"wargame-backend/controllers"
	"wargame-backend/middleware"
)

// Register maps all API endpoints to their handlers.
func Register() {
	http.HandleFunc("/api/health", middleware.CORS(controllers.HandleHealth))
	http.HandleFunc("/api/auth/login", middleware.CORS(controllers.HandleLogin))
	http.HandleFunc("/api/auth/register", middleware.CORS(controllers.HandleRegister))
	http.HandleFunc("/api/progress", middleware.CORS(controllers.HandleProgress))
	http.HandleFunc("/api/verify", middleware.CORS(controllers.HandleVerify))
	http.HandleFunc("/api/leaderboard", middleware.CORS(controllers.HandleLeaderboard))
}
