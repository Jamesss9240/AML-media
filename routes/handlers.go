package routes

import (
	"AML/auth"
	"AML/db"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

var HKey = []byte{0, 48, 28, 48, 13, 34, 64, 84, 7, 32, 1, 6, 8, 47, 3, 7, 90, 255, 82, 205, 157, 10, 8, 34, 55, 143, 63, 99, 208, 20, 134, 166}

type JSONUserLogin struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type JSONUserRegistration struct {
	FirstName string `json:"firstname" binding:"required"`
	LastName  string `json:"lastname" binding:"required"`
	Email     string `json:"email" binding:"required"`
	Password  string `json:"password" binding:"required"`
}

func showLoginPage(c *gin.Context) {
	Render(c, gin.H{"title": "AML - Login"}, "login.html")
}

func showSignupPage(c *gin.Context) {
	Render(c, gin.H{"title": "AML - Signup"}, "signup.html")
}

func ShowIndexPage(c *gin.Context) {
	Render(c, gin.H{"title": "AML - Home"}, "index.html")
}

func performLogin(c *gin.Context) {
	log.Debug("peformlogin")
	var JUL = new(JSONUserLogin)
	// Obtain the form values by POST
	err := c.ShouldBindJSON(&JUL)
	if err != nil {
		c.Set("authenticated", false)
		log.Error("Error binding JSON", zap.Error(err))
		c.HTML(http.StatusBadRequest, "loginnew.html", gin.H{
			"ErrorTitle":   "Login Failed",
			"ErrorMessage": "Invalid Request",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	// Email validation
	log.Info("Form data", zap.String("email", JUL.Email), zap.String("password", JUL.Password))
	if !ValidateEmail(JUL.Email) {
		c.Set("authenticated", false)
		log.Error("Invalid email", zap.Error(err))
		c.HTML(http.StatusBadRequest, "loginnew.html", gin.H{
			"ErrorTitle":   "Login Failed",
			"ErrorMessage": "Error invalid email",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	// Password decrypt
	decryptedpassword, err := auth.DecryptPassword(JUL.Password)
	if err != nil {
		c.Set("authenticated", false)
		if err.Error() == auth.ErrNoPasswordProvided {
			log.Error("No password provided", zap.Error(err))
			c.HTML(http.StatusBadRequest, "loginnew.html", gin.H{
				"ErrorTitle":   "Login Failed",
				"ErrorMessage": "Password not provided",
			})
			c.AbortWithStatus(http.StatusBadRequest)
			return
		}
		log.Error("Error decrypting password", zap.Error(err))
		c.HTML(http.StatusBadRequest, "loginnew.html", gin.H{
			"ErrorTitle":   "Login Failed",
			"ErrorMessage": "Error while parsing password",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	// Try login and generate token
	token, err := auth.TryLoginUser(JUL.Email, decryptedpassword)
	if err != nil || token == "" {
		c.Set("authenticated", false)
		if err.Error() == auth.ErrNoEmailProvided {
			log.Error("No email provided", zap.Error(err))
			c.HTML(http.StatusBadRequest, "loginnew.html", gin.H{
				"ErrorTitle":   "Login Failed",
				"ErrorMessage": "No email provided",
			})
			c.AbortWithStatus(http.StatusBadRequest)
			return
		}
		if err.Error() == auth.ErrNoPasswordProvided {
			log.Error("No password provided", zap.Error(err))
			c.HTML(http.StatusBadRequest, "loginnew.html", gin.H{
				"ErrorTitle":   "Login Failed",
				"ErrorMessage": "No password provided",
			})
			c.AbortWithStatus(http.StatusBadRequest)
			return
		}
		log.Error("Could not login user", zap.Error(err))
		c.HTML(http.StatusBadRequest, "loginnew.html", gin.H{
			"ErrorTitle":   "Login Failed",
			"ErrorMessage": "Invalid credentials provided",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	} else {
		// I am aware this statement is kinda redundant but in terms of authentication you can never be too safe
		// unless you're using a million bit keys and 5 layers of enecryption for some godforsaken reason
		if token != "" {
			log.Info("Form data", zap.String("email", JUL.Email), zap.String("password", JUL.Password))
			c.SetCookie("token", token, 3600, "", "localhost", true, true)
			c.Set("authenticated", true)
			c.JSON(http.StatusOK, gin.H{"message": "Login request was successful!"})
		}
	}
}

func performLogout(c *gin.Context) {
	// Try and see if cookie exists
	_, err := c.Cookie("token")
	if err != nil {
		log.Error("Logout cookie get", zap.Error(err))
		c.Set("authenticated", false)
		c.SetCookie("token", "", -1, "", "localhost", true, true)
		c.Redirect(http.StatusTemporaryRedirect, "/")
		return
	}
	// Ignore above and just clear the cookie anyways lol
	c.Set("authenticated", false)
	c.SetCookie("token", "", -1, "", "localhost", true, true) // Clear the cookie
	c.Redirect(http.StatusTemporaryRedirect, "/")             // Redirect to the home page
}

func performSignup(c *gin.Context) {
	if t, err := c.Cookie("token"); err == nil {
		v, _ := auth.CheckJWT(t)
		if v {
			log.Debug("User tried to sign up while having a valid token")
			c.AbortWithStatus(http.StatusBadRequest)
			return
		}
	}
	// Try and see if context has the authenticated flag
	// if v, e := c.Get("authenticated"); e {
	// 	if v.(bool) {
	// 		return
	// 	}
	// }
	log.Info("peformregistration")
	var JUR = new(JSONUserRegistration)
	// Obtain the form values by POST
	err := c.ShouldBindJSON(&JUR)
	if err != nil {
		c.Set("authenticated", false)
		log.Error("Error binding JSON", zap.Error(err))
		c.HTML(http.StatusBadRequest, "signup.html", gin.H{
			"ErrorTitle":   "Signup Failed",
			"ErrorMessage": "Invalid Request",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	log.Info("Form data:", zap.String("fname", JUR.FirstName), zap.String("lname", JUR.LastName), zap.String("email", JUR.Email), zap.String("password", JUR.Password))
	if ok := ValidateEmail(JUR.Email); !ok {
		c.Set("authenticated", false)
		log.Error("Invalid email")
		c.HTML(http.StatusBadRequest, "signup.html", gin.H{
			"ErrorTitle":   "Registration Failed",
			"ErrorMessage": "Invalid email",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	if ok := ValidateName(JUR.FirstName); !ok {
		c.Set("authenticated", false)
		log.Error("Invalid firstname")
		c.HTML(http.StatusBadRequest, "signup.html", gin.H{
			"ErrorTitle":   "Registration Failed",
			"ErrorMessage": "First name invalid",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	if ok := ValidateName(JUR.LastName); !ok {
		c.Set("authenticated", false)
		log.Error("invalid lastname")
		c.HTML(http.StatusBadRequest, "signup.html", gin.H{
			"ErrorTitle":   "Registration Failed",
			"ErrorMessage": "Last name invalid",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	decryptedpassword, err := auth.DecryptPassword(JUR.Password)
	if err != nil {
		c.Set("authenticated", false)
		if err.Error() == auth.ErrNoPasswordProvided {
			log.Error("No password provided", zap.Error(err))
			c.HTML(http.StatusBadRequest, "loginnew.html", gin.H{
				"ErrorTitle":   "Login Failed",
				"ErrorMessage": "Password not provided",
			})
			c.AbortWithStatus(http.StatusBadRequest)
			return
		}
		log.Error("Error decrypting password", zap.Error(err))
		c.HTML(http.StatusBadRequest, "loginnew.html", gin.H{
			"ErrorTitle":   "Login Failed",
			"ErrorMessage": "Error while parsing password",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	hashedPassword := auth.BcryptPassword(decryptedpassword)
	if err := db.CDBRegisterUser(JUR.Email, JUR.FirstName, JUR.LastName, hashedPassword); err == nil {
		token, err := auth.GenerateSessionToken(JUR.Email, "member")
		if err != nil {
			c.SetCookie("token", "", -1, "", "localhost", true, true)
			c.Set("authenticated", false)
			c.HTML(http.StatusInternalServerError, "signup.html", gin.H{
				"ErrorTitle":   "Login Failed",
				"ErrorMessage": "We was unable to generate a token",
			})
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		c.SetCookie("token", token, 3600, "", "localhost", true, true)
		c.Set("authenticated", true)
		c.JSON(http.StatusOK, gin.H{"message": "Signup request was successful!"})
	} else {
		c.Set("authenticated", false)
		log.Error("Error registering", zap.Error(err))
		c.HTML(http.StatusInternalServerError, "signup.html", gin.H{
			"ErrorTitle":   "Signup Failed",
			"ErrorMessage": "We was unable to signup your account, please try again",
		})
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
}

type InternalJWTVerify struct {
	JWT string `json:"jwt" binding:"required"`
}

func verify(c *gin.Context) {
	var JWTVerify = new(InternalJWTVerify)
	err := c.ShouldBindJSON(&JWTVerify)
	if err != nil {
		log.Error("Error binding JSON for InternalJWTVerify", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}
}

// Demoted to the bottom, not important but the code could be reused
func showPersonalDetails(c *gin.Context) {
	// token, err := c.Cookie("token") // Get token cookie
	// if err != nil {
	// 	log.Println(err)
	// 	c.HTML(http.StatusBadRequest, "login.html", gin.H{
	// 		"ErrorTitle":   "Login Failed",
	// 		"ErrorMessage": "Invalid credentials provided",
	// 	})
	// 	return
	// }
	// MID, err := db.QueryMemberIDByToken(token) // Get member ID by token
	// if err != nil {
	// 	c.HTML(http.StatusBadRequest, "login.html", gin.H{
	// 		"ErrorTitle":   "Login Failed",
	// 		"ErrorMessage": "Invalid credentials provided",
	// 	})
	// 	return
	// }
	// M, err := db.QueryMemberInfoByID(MID) // Get Member row by ID
	// if err != nil {
	// 	c.HTML(http.StatusBadRequest, "login.html", gin.H{
	// 		"ErrorTitle":   "Login Failed",
	// 		"ErrorMessage": "Invalid credentials provided",
	// 	})
	// 	return
	// }
	Render(c, gin.H{
		// "fname": M.FirstName,
		// "lname": M.LastName,
		// "email": M.Email,
		// "date":  M.DateOfBirth,
		"fname": "Unavailable",
		"lname": "Unavailable",
		"email": "Unavailable",
		"date":  "Unavailable",
	}, "personal-details.html")
}
