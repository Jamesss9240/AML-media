package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"os"

	"go.uber.org/zap"
)

// Load from file (not needed as we store the path in an env var)
// func loadPrivateKey(path string) (*rsa.PrivateKey, error) {
// 	privateKeyBytes, err := os.ReadFile(path)
// 	if err != nil {
// 		return nil, err
// 	}

// 	block, _ := pem.Decode(privateKeyBytes)
// 	if block == nil || block.Type != "RSA PRIVATE KEY" {
// 		return nil, fmt.Errorf("failed to decode PEM block containing private key")
// 	}

// 	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return privateKey, nil
// }

// Load key file path and read
func loadPrivateKeyFromEnvFromFile() (*rsa.PrivateKey, error) {
	filePath, e := os.LookupEnv("AML_PK")
	if !e {
		return nil, errors.New("env variable not found")
	}
	if filePath != "" {
		privateKeyBytes, err := os.ReadFile(os.Getenv("AML_PK"))
		if err != nil {
			return nil, err
		}
		block, _ := pem.Decode(privateKeyBytes)
		if block == nil || block.Type != "RSA PRIVATE KEY" {
			return nil, fmt.Errorf("failed to decode PEM block containing private key")
		}
		privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
		if err != nil {
			return nil, err
		}
		return privateKey, nil
	} else {
		return nil, errors.New("filepath empty")
	}
}

// Load key from env
func loadPrivateKeyFromEnv() (*rsa.PrivateKey, error) {
	privateKeyPEM := os.Getenv("AML_PK")
	block, _ := pem.Decode([]byte(privateKeyPEM))
	if block == nil || block.Type != "RSA PRIVATE KEY" {
		return nil, fmt.Errorf("failed to decode PEM block containing private key")
	}
	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	return privateKey, nil
}

func DecryptPassword(encryptedPassword string) (string, error) {
	if encryptedPassword != "" {
		// Decode the base64-encoded encrypted password
		ciphertext, err := base64.StdEncoding.DecodeString(encryptedPassword)
		if err != nil {
			log.Error("base64 decode", zap.Error(err))
			return "", err
		}
		// log.Info("b64 decode", zap.String("ciphertext", string(ciphertext)))
		privateKey, err := loadPrivateKeyFromEnvFromFile()
		if err != nil {
			log.Error("Error loading private key", zap.Error(err))
			return "", err
		}
		// Decrypt the password using the private key
		decryptedBytes, err := rsa.DecryptPKCS1v15(rand.Reader, privateKey, ciphertext)
		if err != nil {
			log.Error("Error decrypting bytes", zap.Error(err))
			return "", err
		}

		return string(decryptedBytes), nil
	}
	return "", errors.New(ErrNoPasswordProvided)
}
