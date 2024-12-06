package db

import (
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

}
