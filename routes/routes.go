package routes

import (
	"AML/auth"
	"AML/logaml"

	"github.com/gin-gonic/gin"
)

var log = logaml.Log

func InitialiseRoutes(router *gin.Engine) {
	router.Use(auth.SetUserStatus())
	router.GET("/", ShowIndexPage)   // Handle the index route
	userRoutes := router.Group("/u") // User group
	{
		userRoutes.GET("/login", auth.EnsureNotLoggedIn(), showLoginPage)
		userRoutes.POST("/login", auth.EnsureNotLoggedIn(), performLogin)
		userRoutes.GET("/loginnew", auth.EnsureNotLoggedIn(), showNewLoginPage)
		userRoutes.POST("/loginnew", auth.EnsureNotLoggedIn(), performLogin)
		userRoutes.GET("/logout", auth.EnsureAuthenticatedLoggedIn(), logout)
		userRoutes.GET("/register", auth.EnsureNotLoggedIn(), showNewRegistrationPage)
		userRoutes.POST("/register", auth.EnsureNotLoggedIn(), register)
		userRoutes.GET("/personal-details", auth.EnsureAuthenticatedLoggedIn(), showPersonalDetails)
		userRoutes.POST("/personal-details", auth.EnsureAuthenticatedLoggedIn(), updatePersonalDetails)
		userRoutes.GET("/profile", auth.EnsureAuthenticatedLoggedIn(), showProfile)
	}
	// logRoutes := router.Group("/personal-log") // log group
	//
	//	{
	//		logRoutes.GET("/view", auth.EnsureAuthenticatedLoggedIn(), ShowLogs)
	//		logRoutes.GET("/view/:log_id", auth.EnsureAuthenticatedLoggedIn(), GetLog)
	//		logRoutes.GET("/create", auth.EnsureAuthenticatedLoggedIn(), ShowLogCreationPage)
	//		logRoutes.POST("/create", auth.EnsureAuthenticatedLoggedIn(), CreateLog)
	//	}
}
