const functions = require("firebase-functions");
const app = require("express")();
const firebaseAuth = require("./util/firebaseAuth");
const { db } = require("./util/admin");
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
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsAsRead
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
app.get("/user/:userHandle", getUserDetails);
app.post("/notifications", firebaseAuth, markNotificationsAsRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore
  .document("likes/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            sender: snapshot.data().userHandle,
            recipient: doc.data().userHandle,
            type: "like",
            read: false,
            screamId: doc.id
          });
        }
      })
      .catch(error => {
        console.log("error in like notification", error);
      });
  });

exports.deleteNotificationOnUnlike = functions.firestore
  .document("likes/{id}")
  .onDelete(snapshot => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(error => {
        console.log("error in delete notification on unlike", error);
      });
  });

exports.createNotificationOnComment = functions.firestore
  .document("comments/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            sender: snapshot.data().userHandle,
            recipient: doc.data().userHandle,
            type: "comment",
            read: false,
            screamId: doc.id
          });
        }
      })
      .catch(error => {
        console.log("error in comment notification", error);
      });
  });

exports.onUserImageChange = functions.firestore
  .document("users/{userId}")
  .onUpdate(change => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log(
        "image url changed from",
        change.before.data().imageUrl,
        " to ",
        change.after.data().imageUrl
      );
      let batch = db.batch();
      db.collection("screams")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then(data => {
          data.forEach(doc => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        })
        .catch(error => {
          console.error("error in onUserImageTrigger", error);
        });
    } else return true;
  });

exports.OnScreamDelete = functions.firestore
  .document("/screams/{screamId}")
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();

    return db
      .collection("comments")
      .where("screamId", "==", screamId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
          .collection("likes")
          .where("screamId", "==", screamId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`likes/${doc.id}`));
        });
        return db
          .collection("notifications")
          .where("screamId", "==", screamId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(error => {
        console.error("error in OnScreamDelete trigger", error);
      });
  });
