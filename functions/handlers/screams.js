const { db } = require("../util/admin");

exports.getAllScreams = (req, res) => {
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
};

exports.postOneScream = (req, res) => {
  let scream = {
    userHandle: req.user.handle,
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
};

exports.getScream = (req, res) => {
  let screamData = {};
  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "scream not found" });
      }
      screamData = doc.data();
      screamData.screamId = req.params.screamId;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("screamId", "==", req.params.screamId)
        .get();
    })
    .then(docs => {
      screamData.comments = [];
      docs.forEach(doc => {
        screamData.comments.push(doc.data());
      });
      return res.json(screamData);
    })
    .catch(error => {
      console.error("error getting a scream", error);
      return res.status(500).json(error);
    });
};

exports.commentOnScream = (req, res) => {
  const comment = req.body.body.trim();
  if (comment === "")
    return res.status(400).json({ error: "comment must not be empty" });

  const newComment = {
    body: comment,
    createdAt: new Date().toISOString(),
    userHandle: req.user.handle,
    screamId: req.params.screamId,
    userImage: req.user.imageUrl
  };

  db.doc(`/screams/${newComment.screamId}`)
    .get()
    .then(docs => {
      if (!docs.exists) {
        return res.status(404).json({ error: "scream not found" });
      }
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch(error => {
      console.error("scream not found", error);
      return res.status(500).json(error);
    });
};
