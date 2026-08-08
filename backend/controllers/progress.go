package controllers

import (
	"log"
	"net/http"

	"wargame-backend/helpers"
	"wargame-backend/middleware"
	"wargame-backend/models"
)

func HandleProgress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		helpers.WriteJSON(w, http.StatusMethodNotAllowed, models.ErrorResponse{
			Success: false, Message: "Method not allowed",
		})
		return
	}

	callsign := middleware.RequireAuth(w, r)
	if callsign == "" {
		return
	}

	currentLevel, totalPoints, err := models.GetPlayerProgress(callsign)
	if err != nil {
		log.Printf("DB error fetching progress for %s: %v", callsign, err)
		helpers.WriteJSON(w, http.StatusInternalServerError, models.ErrorResponse{
			Success: false, Message: "Failed to fetch progress",
		})
		return
	}

	helpers.WriteJSON(w, http.StatusOK, models.ProgressResponse{
		Success:      true,
		Callsign:     callsign,
		CurrentLevel: currentLevel,
		TotalPoints:  totalPoints,
	})
}
