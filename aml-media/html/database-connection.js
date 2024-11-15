
const localDB = new PouchDB('user'); 


const remoteDB = new PouchDB('http://localhost:5984/user'); 


async function fetchDocs() {
  try {
    const response = await remoteDB.allDocs({ include_docs: true });
    console.log('Fetched documents:', response.rows);
  } catch (error) {
    console.error('Error fetching documents:', error);
  }
}


async function addDoc(doc) {
  try {
    const response = await remoteDB.post(doc);
    console.log('Document added with ID:', response.id);
  } catch (error) {
    console.error('Error adding document:', error);
  }
}


const newDoc = {
  _id: '1',  
  name: 'joe',
  age: 30,
  email: 'joe33322@gmail.com'
};
addDoc(newDoc);
fetchDocs();

