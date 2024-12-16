// main.go

package main

import (
	"AML/console"
	"AML/db"
	"AML/logaml"
	"AML/routes"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
)

var router *gin.Engine
var log = logaml.Log

func main() {
	db.CDBCheck()
	// Set Gin to production mode
	gin.SetMode(gin.ReleaseMode)
	router = gin.Default() // This implements a recovery function so panics do not get logged and does not crash!
	// Process the templates at the start so that they don't have to be loaded
	// from the disk again. This makes serving HTML pages very fast.
	router.LoadHTMLGlob("templates/*")
	router.Static("/static", "./static/")
	router.StaticFile("/favicon.ico", "./static/favicon.ico")
	routes.InitialiseRoutes(router)
	router.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{"code": "PAGE_NOT_FOUND", "message": "Page not found"})
	})
	router.GET("/success", func(c *gin.Context) {
		c.String(http.StatusOK, "Post request was successful!")
	})
	// Start serving the application
	go router.RunTLS("127.0.0.1:8080", "./cert.pem", "./mykey.pem")
	go console.Console()
	console.Shutdown = make(chan os.Signal, 1)
	signal.Notify(console.Shutdown, syscall.SIGINT, syscall.SIGTERM, os.Interrupt)
	<-console.Shutdown
	println("Starting Shutdown")
}
