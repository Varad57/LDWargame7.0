package main

import (
	"log"
	"net/http"

	"wargame-backend/config"
	"wargame-backend/database"
	"wargame-backend/routes"
)

func main() {
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.Println("Wargame CTF API Server starting...")

	// Initialize database
	database.Init()
	defer database.Close()

	// Register all routes
	routes.Register()

	// Start HTTP server
	log.Printf("Listening on %s", config.ListenAddr)
	if err := http.ListenAndServe(config.ListenAddr, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
