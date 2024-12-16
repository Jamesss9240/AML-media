package db

import (
	"context"
	"testing"

	kivik "github.com/go-kivik/kivik/v4"
)

func TestDBConnect(t *testing.T) {
	_, err := kivik.New("couch", "http://admin:Dexter233@localhost:5984/")
	if err != nil {
		t.Error(err)
		t.Fail()
		return
	}
}

func TestDBCreateDoc(t *testing.T) {
	client, err := kivik.New("couch", "http://admin:Dexter233@localhost:5984/")
	if err != nil {
		t.Error(err)
		return
	}
	db := client.DB("test")
	if db.Err() != nil {
		t.Log("If no test db is pre existing ignore error and run tests again")
		t.Error(err)
		client.CreateDB(context.TODO(), "test")
	}
	doc := map[string]interface{}{
		"test":  "test",
		"test2": "test2",
		"test3": 200,
	}
	id, rev, err := db.CreateDoc(context.TODO(), doc)
	if err != nil {
		t.Error(err)
	}
	t.Log(id, rev)
}

func TestCDBRegisterUser(t *testing.T) {
	err := CDBRegisterUser("test@email.com", "test", "test", "test")
	if err != nil {
		t.Error(err)
	}
}

func TestCDBGetUserByEmail(t *testing.T) {
	_, err := CDBGetUserByEmail("test@email.com")
	if err != nil {
		t.Error(err)
	}
}
