package auth

import (
	"AML/logaml"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

var log = logaml.Log

///    / \
///   /   \ THIS AUTH MODEL IS OUTDATED AND NEEDS UPDATING THIS MESSAGE WILL BE REMOVED UPON SUCH CHANGES!
///  /  !  \ IT USES THE OLD DATABASE SCHEMA IN SQLITE AND WILL BE UPDATED TO COUCHDB AND JWT
/// /_______\

// Ensure user is logged in and abort if not, INSECURE!
// func EnsureLoggedIn() gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		loggedInInterface, _ := c.Get("is_logged_in")
// 		loggedIn := loggedInInterface.(bool) // type convert to bool
// 		if !loggedIn {
// 			c.HTML(http.StatusUnauthorized, "login.html", gin.H{
// 				"ErrorTitle":   "You need to login to access this content!",
// 				"ErrorMessage": "Login or create an account below"})
// 			c.AbortWithStatus(http.StatusForbidden)
// 		}
// 	}
// }

// Ensure user is logged in and authenticate with token
func EnsureAuthenticatedLoggedIn() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if user is logged in
		loggedInInterface, exists := c.Get("authenticated")
		if !exists {
			c.Set("authenticated", false)
			c.HTML(http.StatusUnauthorized, "login.html", gin.H{
				"ErrorTitle":   "You need to login to access this content!",
				"ErrorMessage": "Login or create an account below"})
			c.AbortWithStatus(http.StatusUnauthorized)
		}
		loggedIn := loggedInInterface.(bool)
		if !loggedIn { // if not abort
			c.HTML(http.StatusBadRequest, "login.html", gin.H{
				"ErrorTitle":   "Login Failed",
				"ErrorMessage": "Invalid credentials provided"})
			c.Abort()
			return
		}
		t, err := c.Cookie("token") // Get cookie
		if err != nil {
			c.Set("authenticated", false)
			c.HTML(http.StatusUnauthorized, "login.html", gin.H{
				"ErrorTitle":   "Login Failed",
				"ErrorMessage": "Invalid credentials provided"})
			c.AbortWithStatus(401)
			return
		}
		if auth, err := CheckJWT(t); err == nil {
			if auth {
				c.Set("authenticated", true)
			} else {
				log.Error("User is not authenticated", zap.Error(err))
				c.Set("authenticated", false)
				c.HTML(http.StatusUnauthorized, "login.html", gin.H{
					"ErrorTitle":   "Login Failed",
					"ErrorMessage": "Invalid credentials provided"})
				c.AbortWithStatus(401)
				return
			}
		} else {
			log.Error("Error while checking token", zap.Error(err))
			c.Set("authenticated", false)
			c.HTML(http.StatusUnauthorized, "login.html", gin.H{
				"ErrorTitle":   "Login Failed",
				"ErrorMessage": "Invalid credentials provided"})
			c.AbortWithStatus(401)
			return
		}
	}
}

// Ensure user is not logged in
func EnsureNotLoggedIn() gin.HandlerFunc {
	return func(c *gin.Context) {
		// No error if the token is not empty or the user is already logged in
		loggedInInterface, e := c.Get("authenticated")
		if e {
			loggedIn := loggedInInterface.(bool)
			if loggedIn { // abort if logged in
				c.AbortWithStatus(http.StatusUnauthorized)
			}
		}
	}
}

// Set whether use is logged in or not
func SetUserStatus() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Println("WHEN IS THIS USED?")
		// if token, err := c.Cookie("token"); err == nil || token != "" {
		// 	t, _, err := db.QueryTokenExists(token)
		// 	if err != nil {
		// 		log.Println("SUS: " + err.Error())
		// 	}
		// 	if t == token { // Check DB token against cookie token yum yum
		// 		c.Set("is_logged_in", true)
		// 	} else {
		// 		c.Set("is_logged_in", false)
		// 	}
		// } else {
		// 	c.Set("is_logged_in", false)
		// }
	}
}
