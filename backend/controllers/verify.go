package controllers

import (
	"fmt"
	"log"
	"net/http"

	"wargame-backend/helpers"
	"wargame-backend/middleware"
	"wargame-backend/models"
)

func HandleVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		helpers.WriteJSON(w, http.StatusMethodNotAllowed, models.ErrorResponse{
			Success: false, Message: "Method not allowed",
		})
		return
	}

	callsign := middleware.RequireAuth(w, r)
	if callsign == "" {
		return
	}

	var req models.VerifyRequest
	if err := helpers.ReadJSON(r, &req); err != nil || req.Flag == "" {
		helpers.WriteJSON(w, http.StatusBadRequest, models.ErrorResponse{
			Success: false, Message: "Flag is required",
		})
		return
	}

	// Validate levelIndex
	if req.LevelIndex < 0 || req.LevelIndex >= TotalLevels {
		helpers.WriteJSON(w, http.StatusBadRequest, models.ErrorResponse{
			Success: false, Message: "Invalid level index",
		})
		return
	}

	// Get the player's current level
	currentLevel, totalPoints, err := models.GetPlayerProgress(callsign)
	if err != nil {
		log.Printf("DB error fetching player %s: %v", callsign, err)
		helpers.WriteJSON(w, http.StatusInternalServerError, models.ErrorResponse{
			Success: false, Message: "Internal server error",
		})
		return
	}

	if req.LevelIndex > currentLevel {
		helpers.WriteJSON(w, http.StatusOK, models.VerifyResponse{
			Success: false,
			Message: "Level locked. You cannot submit a flag for this level yet.",
		})
		return
	}

	// Determine the correct flag for the given levelIndex.
	var correctFlag string
	if req.LevelIndex+1 < TotalLevels {
		correctFlag = levelSecrets[req.LevelIndex].Flag
	} else {
		correctFlag = levelSecrets[req.LevelIndex].Flag
	}

	fmt.Println(correctFlag)

	if req.Flag != correctFlag {
		helpers.WriteJSON(w, http.StatusOK, models.VerifyResponse{
			Success: false,
			Message: "Incorrect flag. Keep searching!",
		})
		return
	}

	// If player is replaying an older level, they don't get new points
	if req.LevelIndex < currentLevel {
		helpers.WriteJSON(w, http.StatusOK, models.VerifyResponse{
			Success:      true,
			Message:      "✔ Correct! (You already completed this level)",
			CurrentLevel: currentLevel,
			TotalPoints:  totalPoints,
			Points:       0,
		})
		return
	}

	// Correct! Award points and advance.
	pointsAwarded := levelSecrets[currentLevel].Points
	newLevel := currentLevel + 1
	newPoints := totalPoints + pointsAwarded

	err = models.UpdatePlayerProgress(callsign, newLevel, newPoints)
	if err != nil {
		log.Printf("DB error updating player %s: %v", callsign, err)
		helpers.WriteJSON(w, http.StatusInternalServerError, models.ErrorResponse{
			Success: false, Message: "Failed to save progress",
		})
		return
	}

	log.Printf("Player %s completed level %d → now at level %d (+%d pts)", callsign, currentLevel, newLevel, pointsAwarded)

	message := fmt.Sprintf("✔ Correct! Level %d unlocked. +%d points!", newLevel+1, pointsAwarded)
	if newLevel >= TotalLevels {
		message = "🎉 Congratulations! You've completed ALL levels! You are a wargame champion! 🏆"
	}

	helpers.WriteJSON(w, http.StatusOK, models.VerifyResponse{
		Success:      true,
		Message:      message,
		CurrentLevel: newLevel,
		TotalPoints:  newPoints,
		Points:       pointsAwarded,
	})
}
