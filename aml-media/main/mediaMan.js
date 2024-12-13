// Define book object
function Book(title, author, publisher, isbn, copies) {
  this.title = title;
  this.author = author;
  this.publisher = publisher;
  this.isbn = isbn;
  this.copies = copies;
}

// Create array to hold book objects
var library = [];

// Function to add a book to the library array
function addBook() {
  // Get values from input fields
  var title = document.getElementById("title").value;
  var author = document.getElementById("author").value;
  var publisher = document.getElementById("publisher").value;
  var isbn = document.getElementById("isbn").value;
  var copies = document.getElementById("copies").value;
  // Create a new book object
  var book = new Book(title, author, publisher, isbn, copies);
  // Add the book object to the library array
  library.push(book);
  displayBooks();
}

// Function to remove a book from the library array
function removeBook() {
  var isbn = prompt("Enter the ISBN of the book to remove:");
  for (var i = 0; i < library.length; i++) {
    if (library[i].isbn === isbn) {
      library.splice(i, 1);
      break;
    }
  }
  // if (!found) {
  // Show an error if ISBN not found
  //alert("Error: Book with ISBN " + isbn + " does not exist in the library.");
  //}
  displayBooks();
}

// Search for book by title, author, or ISBN
function searchBook() {
  var search = document.getElementById("search").value.toLowerCase();
  var matches = [];
  for (var i = 0; i < library.length; i++) {
    if (
      library[i].title.toLowerCase().includes(search) ||
      library[i].author.toLowerCase().includes(search) ||
      library[i].isbn.toLowerCase().includes(search)
    ) {
      matches.push(library[i]);
    }
  }
  displayBooks(matches);
}

// Display all books in library array
function displayBooks(books) {
  var bookList = document.getElementById("bookList");
  bookList.innerHTML = "";
  if (!books) {
    books = library;
  }
  for (var i = 0; i < books.length; i++) {
    var tr = document.createElement("tr");
    var tdTitle = document.createElement("td");
    tdTitle.innerText = books[i].title;
    var tdAuthor = document.createElement("td");
    tdAuthor.innerText = books[i].author;
    var tdPublisher = document.createElement("td");
    tdPublisher.innerText = books[i].publisher;
    var tdIsbn = document.createElement("td");
    tdIsbn.innerText = books[i].isbn;
    var tdCopies = document.createElement("td");
    tdCopies.innerText = books[i].copies;
    tr.appendChild(tdTitle);
    tr.appendChild(tdAuthor);
    tr.appendChild(tdPublisher);
    tr.appendChild(tdIsbn);
    tr.appendChild(tdCopies);
    bookList.appendChild(tr);
  }
}

//https://stackoverflow.com/questions/44690171/how-do-i-go-about-giving-objects-in-arrays-their-properties
//https://www.w3schools.com/js/js_objects.asp
//https://www.w3schools.com/js/js_arrays.asp
//Help from family member with javascript
