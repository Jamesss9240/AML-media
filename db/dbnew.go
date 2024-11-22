package db

import (
	"AML/logaml"
	"context"
	"errors"

	kivik "github.com/go-kivik/kivik/v4"
	_ "github.com/go-kivik/kivik/v4/couchdb" // The CouchDB driver
	"go.uber.org/zap"
)

const (
	ErrConnectingtoCDB   = "couldn't connect to CouchDB"
	ErrUserAlreadyExists = "This user already exists, cannot register"
)

var log = logaml.Log

type User struct {
	ID        string `json:"_id"`
	REV       string `json:"_rev"`
	Email     string `json:"email"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Password  string `json:"password"`
}

// func CDBtest() {
// 	client, err := kivik.New("couch", "http://admin:Dexter233@localhost:5984/")
// 	if err != nil {
// 		log.Error("kivik create DB con", zap.Error(err))
// 		panic(err)
// 	}

// 	db := client.DB("users")

// 	doc := map[string]interface{}{
// 		// "_id":      "0",
// 		"email":     "ejh@gmail.com",
// 		"firstname": "Ethan",
// 		"lastname":  "Hemingway",
// 		"password":  "BlahBlah",
// 	}

// 	rev, err := db.Put(context.TODO(), "ejh@gmail.com", doc)
// 	if err != nil {
// 		panic(err)
// 	}
// 	fmt.Printf("User inserted with revision %s\n", rev)
// }

// func CDBGetUsername() {
// 	client, err := kivik.New("couch", "http://localhost:5984/")
// 	if err != nil {
// 		panic(err)
// 	}

// 	db := client.DB("users")
// 	doc := db.Get(context.TODO(), "ejh@gmail.com")
// 	At, err := doc.Attachments()
// 	if err != nil {
// 		panic(err)
// 	}
// 	if k, e := At.Next(); e != nil {
// 		fmt.Println(k.Content)
// 	}
// 	client.Close()
// 	// doc.ScanDoc() // needs struct tags!
// }

func CDBGetUserByEmail(email string) (*User, error) {
	var TU *User
	client, err := kivik.New("couch", "http://admin:Dexter233@localhost:5984/")
	if err != nil {
		log.Error("kivik create DB con", zap.Error(err))
		return nil, errors.New(ErrConnectingtoCDB)
	}
	db := client.DB("users")
	rows := db.Query(context.TODO(), "_design/user_index", "_view/by_email", kivik.Params(map[string]interface{}{"key": email}))
	for rows.Next() {
		TU := new(User)
		err := rows.ScanValue(TU)
		if err != nil {
			log.Error("ScanValue", zap.Error(err))
			return nil, err
		}
		log.Sugar().Info("Found document: ", TU)
		log.Sugar().Info("ID: ", TU.ID, " FirstName: ", TU.FirstName, " LastName: ", TU.FirstName, " Email: ", TU.Email, " Password: ", TU.Password)
		return TU, nil
	}
	if rows.Err() != nil {
		log.Error("CDBGetEmail rows.err", zap.Error(err))
		return nil, err
	}
	return TU, nil
}

// func CDBCheckPassword(email string, password string) bool {
// 	U, err := CDBGetUserByEmail(email)
// 	if err != nil {
// 		log.Error("Error getting user information", zap.Error(err))
// 	}
// 	if U.Password == password {
// 		return true
// 	}
// 	return false
// }

func CDBRegisterUser(email string, firstname string, lastname string, password string) error {
	client, err := kivik.New("couch", "http://admin:Dexter233@localhost:5984/")
	if err != nil {
		log.Error("kivik create DB con", zap.Error(err))
		return errors.New(ErrConnectingtoCDB)
	}
	db := client.DB("users")
	User, err := CDBGetUserByEmail(email)
	if err != nil {
		log.Error("Error while attempting to get user during registration", zap.Error(err))
	}
	if User != nil {
		// if User.Email == email {
		log.Error("User already exists")
		return errors.New(ErrUserAlreadyExists)
		// }
	}

	doc := map[string]interface{}{
		"email":     email,
		"firstname": firstname,
		"lastname":  lastname,
		"password":  password,
	}
	docid, rev, err := db.CreateDoc(context.TODO(), doc)
	// rev, err := db.Put(context.Background(), "", doc)
	if err != nil {
		log.Error("Registration CDB Failed", zap.Error(err))
		return err
	}
	log.Info("User registered", zap.String("docid", docid), zap.String("revid", rev))
	// fmt.Printf("User inserted with revision %s\n", rev)
	return nil
}
