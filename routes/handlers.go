package routes

import (
	"AML/auth"
	"AML/db"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

var HKey = []byte{0, 48, 28, 48, 13, 34, 64, 84, 7, 32, 1, 6, 8, 47, 3, 7, 90, 255, 82, 205, 157, 10, 8, 34, 55, 143, 63, 99, 208, 20, 134, 166}

func showLoginPage(c *gin.Context) {
	Render(c, gin.H{
		"title": "Login",
	}, "login.html")
}

func showNewLoginPage(c *gin.Context) {
	Render(c, gin.H{
		"title": "New Login",
	}, "loginnew.html")
}

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

type JSONUserLogin struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func performLogin(c *gin.Context) {
	log.Info("peformlogin")
	var JUL = new(JSONUserLogin)
	// Obtain the form values by POST
	err := c.ShouldBindJSON(&JUL)
	if err != nil {
		log.Error("Error binding JSON", zap.Error(err))
		c.HTML(http.StatusBadRequest, "loginnew.html", gin.H{
			"ErrorTitle":   "Login Failed",
			"ErrorMessage": "Invalid Request",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	// email := c.PostForm("email")
	// password := c.PostForm("password")
	log.Info("Form data", zap.String("email", JUL.Email), zap.String("password", JUL.Password))
	if !ValidateEmail(JUL.Email) {
		log.Error("Invalid email", zap.Error(err))
		c.HTML(http.StatusBadRequest, "loginnew.html", gin.H{
			"ErrorTitle":   "Login Failed",
			"ErrorMessage": "Error invalid email",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	decryptedpassword, err := auth.DecryptPassword(JUL.Password)
	if err != nil {
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
	token, err := auth.TryLoginUser(JUL.Email, decryptedpassword)
	if err != nil || token == "" {
		if err.Error() == auth.ErrNoEmailProvided {
			log.Error("No email provided", zap.Error(err))
			c.HTML(http.StatusBadRequest, "loginnew.html", gin.H{
				"ErrorTitle":   "Login Failed",
				"ErrorMessage": "No email provided",
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
	}
	log.Info("Form data", zap.String("email", JUL.Email), zap.String("password", JUL.Password))
	c.SetCookie("token", token, 3600, "", "localhost", true, true)
	// Check if the username/password combination is valid

	// if isUserValid(email, password) { // If the username/password is valid set the token in a cookie
	// 	M, err := db.QueryMemberID(email, password)
	// 	if err != nil {
	// 		log.Println(err)
	// 		c.HTML(http.StatusBadRequest, "login.html", gin.H{
	// 			"ErrorTitle":   "Login Failed",
	// 			"ErrorMessage": "1" + err.Error(),
	// 		})
	// 		return
	// 	}
	// 	token := generateSessionToken()
	// 	err = db.InsertToken(token, strconv.Itoa(M))
	// 	if err != nil {
	// 		log.Println(err)
	// 		c.HTML(http.StatusBadRequest, "login.html", gin.H{
	// 			"ErrorTitle":   "Login Failed",
	// 			"ErrorMessage": "2" + err.Error(),
	// 		})
	// 		return
	// 	}
	// 	c.SetCookie("token", token, 3600, "", "", false, true)
	// 	c.Set("is_logged_in", true)
	// 	Render(c, gin.H{
	// 		"title": "Successful Login"}, "login-successful.html")

	// } else {
	// 	// If invalid show the error message on the login page
	// 	c.HTML(http.StatusBadRequest, "login.html", gin.H{
	// 		"ErrorTitle":   "Login Failed",
	// 		"ErrorMessage": "Invalid credentials provided"})
	// }
}

func logout(c *gin.Context) {
	_, err := c.Cookie("token")
	if err != nil {
		log.Error("Logout cookie get", zap.Error(err))
		c.SetCookie("token", "", -1, "", "", false, true)
		c.Redirect(http.StatusTemporaryRedirect, "/")
		return
	}
	c.SetCookie("token", "", -1, "", "", false, true) // Clear the cookie
	c.Redirect(http.StatusTemporaryRedirect, "/")     // Redirect to the home page
}

func showRegistrationPage(c *gin.Context) {
	Render(c, gin.H{"title": "Register"}, "register.html")
}

func showNewRegistrationPage(c *gin.Context) {
	Render(c, gin.H{"title": "Register"}, "registernew.html")
}

func ShowIndexPage(c *gin.Context) {
	Render(c, gin.H{"title": "Home Page"}, "index.html")
}

type JSONUserRegistration struct {
	FirstName string `json:"firstname" binding:"required"`
	LastName  string `json:"lastname" binding:"required"`
	Email     string `json:"email" binding:"required"`
	Password  string `json:"password" binding:"required"`
}

func register(c *gin.Context) {
	if v, e := c.Get("authenticated"); e {
		if v.(bool) {
			return
		}
	}
	log.Info("peformregistration")
	var JUR = new(JSONUserRegistration)
	// Obtain the form values by POST
	err := c.ShouldBindJSON(&JUR)
	if err != nil {
		log.Error("Error binding JSON", zap.Error(err))
		c.HTML(http.StatusBadRequest, "loginnew.html", gin.H{
			"ErrorTitle":   "Login Failed",
			"ErrorMessage": "Invalid Request",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	// log.Info("Form data", zap.String("email", JUR.Email), zap.String("password", JUR.Password))
	// if ok := auth.CheckIfValidBcrypt(JUR.Password); !ok {
	// 	c.HTML(http.StatusBadRequest, "register.html", gin.H{
	// 		"ErrorTitle":   "Registration Failed",
	// 		"ErrorMessage": "Invalid hash",
	// 	})
	// 	return
	// }
	log.Info("Form data:", zap.String("fname", JUR.FirstName), zap.String("lname", JUR.LastName), zap.String("email", JUR.Email), zap.String("password", JUR.Password))
	if ok := ValidateEmail(JUR.Email); !ok {
		log.Error("Invalid email")
		c.HTML(http.StatusBadRequest, "register.html", gin.H{
			"ErrorTitle":   "Registration Failed",
			"ErrorMessage": "Invalid email",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	if ok := ValidateName(JUR.FirstName); !ok {
		log.Error("Invalid firstname")
		c.HTML(http.StatusBadRequest, "register.html", gin.H{
			"ErrorTitle":   "Registration Failed",
			"ErrorMessage": "First name invalid",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	if ok := ValidateName(JUR.LastName); !ok {
		log.Error("invalid lastname")
		c.HTML(http.StatusBadRequest, "register.html", gin.H{
			"ErrorTitle":   "Registration Failed",
			"ErrorMessage": "Last name invalid",
		})
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	decryptedpassword, err := auth.DecryptPassword(JUR.Password)
	if err != nil {
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
		token, err := auth.GenerateSessionToken(JUR.Email)
		if err != nil {
			c.SetCookie("token", "", -1, "", "localhost", true, true)
			c.Set("authenticated", false)
			c.HTML(http.StatusInternalServerError, "register.html", gin.H{
				"ErrorTitle":   "Login Failed",
				"ErrorMessage": "We was unable to generate a token",
			})
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		c.SetCookie("token", token, 3600, "", "localhost", true, true)
		c.Set("authenticated", true)
	} else {
		log.Error("Error registering", zap.Error(err))
		c.HTML(http.StatusInternalServerError, "register.html", gin.H{
			"ErrorTitle":   "Registration Failed",
			"ErrorMessage": "We was unable to register your account, please try again",
		})
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
}
