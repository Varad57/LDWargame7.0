package controllers

import (
	"log"
	"net/http"

	"wargame-backend/helpers"
	"wargame-backend/models"
)

func HandleLeaderboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		helpers.WriteJSON(w, http.StatusMethodNotAllowed, models.ErrorResponse{
			Success: false, Message: "Method not allowed",
		})
		return
	}

	callsign := r.URL.Query().Get("callsign")

	entries, err := models.GetLeaderboardWithUser(callsign, 20)
	if err != nil {
		log.Printf("DB error fetching leaderboard: %v", err)
		helpers.WriteJSON(w, http.StatusInternalServerError, models.ErrorResponse{
			Success: false, Message: "Internal server error",
		})
		return
	}

	helpers.WriteJSON(w, http.StatusOK, entries)
}
