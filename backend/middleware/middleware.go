package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"wargame-backend/config"
	"wargame-backend/helpers"
	"wargame-backend/models"

	"github.com/golang-jwt/jwt/v5"
)

// ──────────────────────────────────────────────────────────────────────────────
// CORS Middleware
// ──────────────────────────────────────────────────────────────────────────────

// CORS wraps a handler with permissive CORS headers.
func CORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

// ──────────────────────────────────────────────────────────────────────────────
// JWT Helpers
// ──────────────────────────────────────────────────────────────────────────────

// GenerateToken creates a signed JWT for the given callsign.
func GenerateToken(callsign string) (string, error) {
	claims := models.Claims{
		Callsign: callsign,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(72 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(config.JWTSecret)
}

// ValidateToken parses and validates a JWT string.
func ValidateToken(tokenStr string) (*models.Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &models.Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return config.JWTSecret, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*models.Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}

// RequireAuth extracts and validates the JWT from the Authorization header.
// Returns the callsign on success, or writes an error response and returns "".
func RequireAuth(w http.ResponseWriter, r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		helpers.WriteJSON(w, http.StatusUnauthorized, models.ErrorResponse{
			Success: false, Message: "Missing Authorization header",
		})
		return ""
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		helpers.WriteJSON(w, http.StatusUnauthorized, models.ErrorResponse{
			Success: false, Message: "Invalid Authorization format. Use: Bearer <token>",
		})
		return ""
	}

	claims, err := ValidateToken(parts[1])
	if err != nil {
		helpers.WriteJSON(w, http.StatusUnauthorized, models.ErrorResponse{
			Success: false, Message: "Invalid or expired token",
		})
		return ""
	}

	return claims.Callsign
}
