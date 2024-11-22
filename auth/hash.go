package auth

import (
	"crypto/sha1"
	"io"
)

func Hash(data string) string {
	// Create a new SHA-1 hash
	h := sha1.New()
	// Write data to the hash
	io.WriteString(h, data)
	// Compute the final hash
	hash := h.Sum(nil)
	return string(hash)
}
