package helpers

import (
	"encoding/json"
	"net/http"
)

// WriteJSON serializes data as JSON and writes it with the given status code.
func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// ReadJSON decodes the request body into the provided struct.
func ReadJSON(r *http.Request, v interface{}) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}
