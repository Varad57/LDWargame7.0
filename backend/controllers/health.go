package controllers

import (
	"net/http"
	"time"

	"wargame-backend/helpers"
)

func HandleHealth(w http.ResponseWriter, r *http.Request) {
	helpers.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status": "ok",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}
