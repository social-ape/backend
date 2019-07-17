const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require("express")();
const firebase = require("firebase");
const firebaseConfig = {
  apiKey: "AIzaSyAxBI3A8jonl6mtOvV0Muk-crVOhZxBxFk",
  authDomain: "socialape-2db87.firebaseapp.com",
  databaseURL: "https://socialape-2db87.firebaseio.com",
  projectId: "socialape-2db87",
  storageBucket: "socialape-2db87.appspot.com",
  messagingSenderId: "217816631869",
  appId: "1:217816631869:web:10bc93ff00b62abd"
};

var serviceAccount = require("./../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialape-2db87.firebaseio.com"
});

firebase.initializeApp(firebaseConfig);
const db = admin.firestore();

app.get("/screams", (req, res) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(screams);
    })
    .catch(error => {
      console.log(error);
    });
});

app.post("/scream", (req, res) => {
  let scream = {
    userHandle: req.body.userHandle,
    body: req.body.body,
    createdAt: new Date().toISOString()
  };

  db.collection("screams")
    .add(scream)
    .then(doc => {
      res.json({ message: `document ${doc.id} created` });
    })
    .catch(error => {
      console.log("error adding scream", error);
      res.status(500).json({ error: "error adding new scream" });
    });
});

app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  // create user with email and password
  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      // save this newly created user in firestore
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        createdAt: new Date().toISOString(),
        email: newUser.email,
        userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(error => {
      console.log("error signing up", error);
      if (error.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "email is already in use" });
      }
      return res.status(500).json({ error: error.code });
    });
});

exports.api = functions.https.onRequest(app);
