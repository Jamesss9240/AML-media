package auth

import (
	"AML/logaml"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

var log = logaml.Log

// Ensure user is logged in and authenticate with token
func EnsureAuthenticatedLoggedIn() gin.HandlerFunc {
	return func(c *gin.Context) {
		t, err := c.Cookie("token") // Get cookie
		if err != nil {
			c.Set("authenticated", false)
			c.HTML(http.StatusUnauthorized, "login.html", gin.H{
				"ErrorTitle":   "Login Failed",
				"ErrorMessage": "Invalid credentials provided"})
			c.AbortWithStatus(http.StatusUnauthorized)
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
				c.AbortWithStatus(http.StatusUnauthorized)
				return
			}
		} else {
			log.Error("Error while checking token", zap.Error(err))
			c.Set("authenticated", false)
			c.HTML(http.StatusUnauthorized, "login.html", gin.H{
				"ErrorTitle":   "Login Failed",
				"ErrorMessage": "Invalid credentials provided"})
			c.AbortWithStatus(http.StatusUnauthorized)
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
				log.Info("Redirecting to /")
				c.Redirect(http.StatusTemporaryRedirect, "/")
				return
			}
		}
		t, err := c.Cookie("token")
		if err != nil {
			// log.Error("Error getting cookie, not authenticated", zap.Error(err))
			c.Set("authenticated", false)
		} else {
			if valid, err := CheckJWT(t); err != nil {
				c.Set("authenticated", false)
				log.Error("User not authenticated", zap.Error(err))
				if !valid {
					log.Info("Token invalid, potential tampering?")
				}
				return
			} else {
				if valid {
					c.Set("authenticated", true)
					log.Info("User is authenticated")
				} else {
					c.Set("authenticated", false)
					log.Info("Token invalid, potential tampering?")
				}
			}
		}
	}
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, access-control-allow-origin")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(200)
			return
		}

		c.Next()
	}
}

// Set whether use is logged in or not, no longer needed
// func SetUserStatus() gin.HandlerFunc {
// return func(c *gin.Context) {
// fmt.Println("WHEN IS THIS USED?, ok I remember here we can check the token constantly and award a new token if the user wants to extend their time using the system, we must make sure it isn't reawarded after a huge amount of time")
// // if token, err := c.Cookie("token"); err == nil || token != "" {
// // 	t, _, err := db.QueryTokenExists(token)
// // 	if err != nil {
// // 		log.Println("SUS: " + err.Error())
// // 	}
// // 	if t == token { // Check DB token against cookie token yum yum
// // 		c.Set("is_logged_in", true)
// // 	} else {
// // 		c.Set("is_logged_in", false)
// // 	}
// // } else {
// // 	c.Set("is_logged_in", false)
// // }
// }
// }
