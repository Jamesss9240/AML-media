package routes

import (
	"net/mail"
	"regexp"
)

func ValidateEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

func ValidatePassword(password string) {} // Validate on client side, when it gets sent it is hashed and salted, we do not know any information about it

func ValidateName(name string) bool {
	// Regular expression for validating names
	nameRegex := `^[a-zA-Z]+([ '-][a-zA-Z]+)*$`
	re := regexp.MustCompile(nameRegex)
	return re.MatchString(name)
}
