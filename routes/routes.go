package routes

import (
	"AML/auth"
	"AML/logaml"

	"github.com/gin-gonic/gin"
)

var log = logaml.Log

func InitialiseRoutes(router *gin.Engine) {
	// router.Use(auth.SetUserStatus())
	// router.GET("/", ShowIndexPage)   // Handle the index route
	router.GET("/login", auth.EnsureNotLoggedIn(), showLoginPage)
	router.POST("/login", auth.EnsureNotLoggedIn(), performLogin)
	router.GET("/logout", auth.EnsureAuthenticatedLoggedIn(), performLogout)
	router.GET("/signup", auth.EnsureNotLoggedIn(), showSignupPage)
	router.POST("/signup", auth.EnsureNotLoggedIn(), performSignup)
	// router.POST("/verify", verify)
}
