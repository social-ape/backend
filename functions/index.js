const functions = require("firebase-functions");
const admin = require("firebase-admin");

var serviceAccount = require("./../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialape-2db87.firebaseio.com"
});

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

exports.getScreams = functions.https.onRequest((req, res) => {
  admin
    .firestore()
    .collection("screams")
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        screams.push(doc.data());
      });
      return res.json(screams);
    })
    .catch(error => {
      console.log(error);
    });
});

exports.addScream = functions.https.onRequest((req, res) => {
  if (req.method !== "POST") {
    return res.status(400).json({ error: "GET Method not allowed" });
  }

  let scream = {
    userHandle: req.body.userHandle,
    body: req.body.body,
    createdAt: admin.firestore.Timestamp.fromDate(new Date())
  };
  admin
    .firestore()
    .collection("screams")
    .add(scream)
    .then(doc => {
      res.json({ message: `document ${doc.id} created` });
    })
    .catch(error => {
      console.log("error adding scream", error);
      res.status(500).json({ error: "error adding new scream" });
    });
});
