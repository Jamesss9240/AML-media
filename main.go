// main.go

package main

import (
	"AML/console"
	"AML/db"
	"AML/logaml"
	"AML/routes"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
)

var router *gin.Engine
var log = logaml.Log

func main() {
	db.CDBGetUserByEmail("user@example.com")
	// Set Gin to production mode
	gin.SetMode(gin.DebugMode)
	router = gin.Default() // This implements a recovery function so panics do not get logged and does not crash!
	// Process the templates at the start so that they don't have to be loaded
	// from the disk again. This makes serving HTML pages very fast.
	router.LoadHTMLGlob("templates/*")
	router.Static("/static", "./static/")
	routes.InitialiseRoutes(router)
	// Start serving the application
	// go router.Run("127.0.0.1:8080")
	go router.RunTLS("127.0.0.1:8080", "./cert.pem", "./mykey.pem")
	go console.Console()
	console.Shutdown = make(chan os.Signal, 1)
	signal.Notify(console.Shutdown, syscall.SIGINT, syscall.SIGTERM, os.Interrupt)
	<-console.Shutdown
	println("Starting Shutdown")
	// err = db.DeleteAllTokens()
	// if err != nil {
	// 	log.Println(err)
	// 	panic(err)
	// }
}
