const functions = require("firebase-functions");
const app = require("express")();
const firebaseAuth = require("./util/firebaseAuth");
const {
  getAllScreams,
  postOneScream,
  getScream
} = require("./handlers/screams");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require("./handlers/users");

app.get("/screams", getAllScreams);
app.post("/scream", firebaseAuth, postOneScream);
app.get("/scream/:screamId", getScream);

app.post("/signup", signup);
app.post("/login", login);

app.get("/user", firebaseAuth, getAuthenticatedUser);
app.post("/user", firebaseAuth, addUserDetails);
app.post("/user/image", firebaseAuth, uploadImage);

exports.api = functions.https.onRequest(app);
