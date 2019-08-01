const functions = require("firebase-functions");
const app = require("express")();
const firebaseAuth = require("./util/firebaseAuth");
const {
  getAllScreams,
  postOneScream,
  deleteScream,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream
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
app.delete("/scream/:screamId", firebaseAuth, deleteScream);
app.get("/scream/:screamId", getScream);
app.post("/scream/:screamId/comment", firebaseAuth, commentOnScream);
app.get("/scream/:screamId/like", firebaseAuth, likeScream);
app.get("/scream/:screamId/unlike", firebaseAuth, unlikeScream);

app.post("/signup", signup);
app.post("/login", login);

app.get("/user", firebaseAuth, getAuthenticatedUser);
app.post("/user", firebaseAuth, addUserDetails);
app.post("/user/image", firebaseAuth, uploadImage);

exports.api = functions.https.onRequest(app);
