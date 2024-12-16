package routes

import (
	"net/mail"
	"regexp"
)

func ValidateEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

func ValidateName(name string) bool {
	// Regular expression for validating names
	nameRegex := `^[a-zA-Z]+([ '-][a-zA-Z]+)*$`
	re := regexp.MustCompile(nameRegex)
	return re.MatchString(name)
}
