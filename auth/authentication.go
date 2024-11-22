package auth

import (
	"AML/db"
	"errors"

	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

const (
	ErrIncorrectPassword  = "password hash and password mismatch"
	ErrNoPasswordProvided = "no password provided"
	ErrNoEmailProvided    = "no email provided"
	ErrUserNil            = "user returned is nil"
)

func TryLoginUser(email string, password string) (string, error) {
	if email == "" {
		return "", errors.New(ErrNoEmailProvided)
	}
	if password == "" {
		return "", errors.New(ErrNoPasswordProvided)
	}
	User, err := db.CDBGetUserByEmail(email)
	if err != nil {
		log.Error("Couldn't get user", zap.Error(err))
		return "", err
	}
	if User == nil {
		log.Error(ErrUserNil)
		return "", errors.New(ErrUserNil)
	}
	err = bcrypt.CompareHashAndPassword([]byte(User.Password), []byte(password))
	if err != nil {
		log.Error("Compare hash error", zap.Error(err))
		return "", errors.New(ErrIncorrectPassword)
	}
	token, err := GenerateSessionToken(email)
	if err != nil {
		log.Error("Error generating token while trying to login", zap.Error(err))
		return "", err
	}
	return token, nil
}
