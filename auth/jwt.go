package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
)

const (
	ErrorTokenExpired = "token is expired"
	ErrTokenClaim     = "token claim couldn't be decoded"
	ErrTokenParse     = "token couldn't be parsed"
)

var HKey = []byte{0, 48, 28, 48, 13, 34, 64, 84, 7, 32, 1, 6, 8, 47, 3, 7, 90, 255, 82, 205, 157, 10, 8, 34, 55, 143, 63, 99, 208, 20, 134, 166}

func GenerateSessionToken(email string) (string, error) {
	// Create a new token object, specifying signing method and the claims
	// you would like it to contain.
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"iss":        "AML",
		"exp":        time.Now().Add(10 * time.Minute),
		"iat":        time.Now(),
		"nbf":        time.Now(),
		"authorised": true,
		"user":       email,
		"vue":        Hash(email),
	})

	// Sign and get the complete encoded token as a string using the secret
	tokenString, err := token.SignedString(HKey)
	if err != nil {
		log.Error("Error signing token", zap.Error(err))
		return "", err
	}
	log.Info("Awarded token")
	// fmt.Println(tokenString, err)
	return tokenString, nil
}

func CheckJWT(tokenString string) (bool, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Don't forget to validate the alg is what you expect:
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}
		return HKey, nil
	})
	if err != nil {
		log.Error("Checking JWT", zap.Error(err))
		return false, errors.New(ErrTokenParse)
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		fmt.Println(claims["iss"], claims["exp"], claims["iat"], claims["nbf"], claims["authorised"], claims["user"])
		if claims["exp"].(time.Time).After(time.Now()) {
			return false, errors.New(ErrorTokenExpired)
		}
		return true, nil
	} else {
		log.Error("error checking JWT", zap.Error(err))
		return false, errors.New(ErrTokenClaim)
	}
}
