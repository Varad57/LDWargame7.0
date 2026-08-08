package controllers

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"wargame-backend/helpers"
	"wargame-backend/middleware"
	"wargame-backend/models"

	"golang.org/x/crypto/bcrypt"
)

// HandleRegister handles POST /api/auth/register.
//
// Request:  { "callsign": "hacker_one", "password": "supersecret" }
// Response: { "success": true, "message": "..." }
func HandleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		helpers.WriteJSON(w, http.StatusMethodNotAllowed, models.ErrorResponse{
			Success: false, Message: "Method not allowed",
		})
		return
	}

	var req models.RegisterRequest
	if err := helpers.ReadJSON(r, &req); err != nil || req.Callsign == "" || req.Password == "" {
		helpers.WriteJSON(w, http.StatusBadRequest, models.ErrorResponse{
			Success: false, Message: "Callsign and password are required",
		})
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Bcrypt error: %v", err)
		helpers.WriteJSON(w, http.StatusInternalServerError, models.ErrorResponse{
			Success: false, Message: "Internal server error",
		})
		return
	}

	err = models.CreatePlayer(req.Callsign, string(hash))
	if err != nil {
		log.Printf("DB error during register: %v", err)
		helpers.WriteJSON(w, http.StatusConflict, models.ErrorResponse{
			Success: false, Message: "Callsign already taken",
		})
		return
	}

	log.Printf("Player registered: %s", req.Callsign)

	helpers.WriteJSON(w, http.StatusOK, models.LoginResponse{
		Success:  true,
		Callsign: req.Callsign,
		Message:  "Registration successful! You can now log in.",
	})
}

func HandleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		helpers.WriteJSON(w, http.StatusMethodNotAllowed, models.ErrorResponse{
			Success: false, Message: "Method not allowed",
		})
		return
	}

	var req models.LoginRequest
	if err := helpers.ReadJSON(r, &req); err != nil || req.Callsign == "" || req.Password == "" {
		helpers.WriteJSON(w, http.StatusBadRequest, models.ErrorResponse{
			Success: false, Message: "Callsign and password are required",
		})
		return
	}

	storedHash, err := models.GetPasswordHash(req.Callsign)
	if err != nil {
		if err == sql.ErrNoRows {
			// Auto-register
			hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
			if err != nil {
				log.Printf("Bcrypt error: %v", err)
				helpers.WriteJSON(w, http.StatusInternalServerError, models.ErrorResponse{
					Success: false, Message: "Internal server error",
				})
				return
			}
			if err := models.CreatePlayer(req.Callsign, string(hash)); err != nil {
				log.Printf("DB error during auto-register: %v", err)
				helpers.WriteJSON(w, http.StatusInternalServerError, models.ErrorResponse{
					Success: false, Message: "Failed to create user",
				})
				return
			}
			log.Printf("Player auto-registered: %s", req.Callsign)
		} else {
			log.Printf("DB error during login: %v", err)
			helpers.WriteJSON(w, http.StatusInternalServerError, models.ErrorResponse{
				Success: false, Message: "Internal server error",
			})
			return
		}
	} else {
		// User exists, check password
		if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(req.Password)); err != nil {
			helpers.WriteJSON(w, http.StatusUnauthorized, models.ErrorResponse{
				Success: false, Message: "Invalid callsign or password",
			})
			return
		}
	}

	token, err := middleware.GenerateToken(req.Callsign)
	if err != nil {
		log.Printf("Token generation error: %v", err)
		helpers.WriteJSON(w, http.StatusInternalServerError, models.ErrorResponse{
			Success: false, Message: "Failed to generate token",
		})
		return
	}

	log.Printf("Player logged in: %s", req.Callsign)

	helpers.WriteJSON(w, http.StatusOK, models.LoginResponse{
		Success:  true,
		Token:    token,
		Callsign: req.Callsign,
		Message:  fmt.Sprintf("Welcome aboard, %s!", req.Callsign),
	})
}
