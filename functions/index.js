const functions = require("firebase-functions");
const app = require("express")();
const firebaseAuth = require("./util/firebaseAuth");
const { getAllScreams, postOneScream } = require("./handlers/screams");
const { signup, login } = require("./handlers/users");

app.get("/screams", getAllScreams);

app.post("/scream", firebaseAuth, postOneScream);

app.post("/signup", signup);

app.post("/login", login);
exports.api = functions.https.onRequest(app);
