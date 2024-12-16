package auth

import (
	"AML/db"
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
	ErrTokenTamper    = "token potentially tampered"
)

var HKey = []byte{0, 48, 28, 48, 13, 34, 64, 84, 7, 32, 1, 6, 8, 47, 3, 7, 90, 255, 82, 205, 157, 10, 8, 34, 55, 143, 63, 99, 208, 20, 134, 166}

func GenerateSessionToken(email string, role string) (string, error) {
	// Create a new token object, specifying signing method and the claims
	// you would like it to contain.
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"iss":        "AML",
		"exp":        time.Now().UTC().Add(60 * time.Minute).Unix(),
		"iat":        time.Now().UTC().Unix(),
		"nbf":        time.Now().UTC().Unix(),
		"authorised": true,
		"user":       email,
		"hue":        Hash(email),
		"role":       role,
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
		fmt.Println(claims["iss"], claims["exp"], claims["iat"], claims["nbf"], claims["authorised"], claims["user"], claims["hue"])
		t := time.Unix(int64(claims["exp"].(float64)), 0).UTC()
		if time.Now().UTC().After(t) {
			log.Info("Token expired")
			return false, errors.New(ErrorTokenExpired)
		}
		U, err := db.CDBGetUserByEmail(claims["user"].(string))
		if err != nil {
			log.Error("Error getting user while attempting authentication", zap.Error(err))
			return false, err
		}
		if U.Email != claims["user"].(string) {
			log.Error("User email and token email mismatch")
			return false, errors.New(ErrTokenTamper)
		}
		if Hash(U.Email) != claims["hue"].(string) {
			log.Error("User hashed email and token hashed email mismatch")
			log.Info("Mismatch", zap.String("DB", Hash(U.Email)), zap.String("Token", claims["hue"].(string)))
			return false, errors.New(ErrTokenTamper)
		} else {
			log.Info("Token an DB Email Hash match!", zap.String("DB", Hash(U.Email)), zap.String("Token", claims["hue"].(string)))
		}
		return true, nil
	} else {
		log.Error("error checking JWT", zap.Error(err))
		return false, errors.New(ErrTokenClaim)
	}
}
