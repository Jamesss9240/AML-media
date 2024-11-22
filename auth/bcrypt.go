package auth

import "golang.org/x/crypto/bcrypt"

func CheckIfValidBcrypt(hashString string) bool {
	// bcrypt hashes are 60 characters long
	if len(hashString) != 60 {
		return false
	}
	// Check if the hash string starts with the bcrypt identifier
	if hashString[:4] != "$2a$" && hashString[:4] != "$2b$" {
		return false
	}
	return true
}

func BcryptPassword(password string) string {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		panic(err)
	}
	return string(hashedPassword)
}
