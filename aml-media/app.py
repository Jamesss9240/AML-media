from flask import Flask, render_template, url_for

app = Flask(__name__) 

@app.route("/")
def index():
    return render_template("index.html")
if __name__ == "__name__":
    app.run(debug=True)
    # test
import couchdb
couch = couchdb.Server()
db = couch.create('test1')