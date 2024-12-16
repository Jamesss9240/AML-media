package auth

import (
	"crypto/sha1"
	"fmt"
	"io"
)

var predeterminedSalt = "/231@!-0921"

func Hash(data string) string {
	// Create a new SHA-1 hash
	h := sha1.New()
	// Write data to the hash
	io.WriteString(h, data+predeterminedSalt)
	// Compute the final hash
	hash := h.Sum(nil)
	hashString := fmt.Sprintf("%x", hash)
	return hashString
}
