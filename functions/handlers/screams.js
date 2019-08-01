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
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };

  db.collection("screams")
    .add(scream)
    .then(doc => {
      scream.screamId = doc.id;
      res.json(scream);
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

exports.deleteScream = (req, res) => {
  const document = db.doc(`/screams/${req.params.screamId}`);
  document
    .get()
    .then(doc => {
      if (!doc.exists) {
        res.status(404).json({ error: "scream not found" });
      } else if (doc.data().userHandle !== req.user.handle) {
        res.status(403).json({ error: "unauthorized:connot delete scream" });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: "scream deleted successfully" });
    })
    .catch(error => {
      console.log("error deleting scream", error);
      res.status(500).json(error);
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
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "scream not found" });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch(error => {
      console.error("error commenting on scream", error);
      return res.status(500).json(error);
    });
};

exports.likeScream = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("screamId", "==", req.params.screamId);

  const screamDocument = db.doc(`screams/${req.params.screamId}`);

  let screamData;
  screamDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "scream not found" });
      }
    })
    .then(data => {
      if (data.empty) {
        db.collection("likes")
          .add({
            userHandle: req.user.handle,
            screamId: screamData.screamId
          })
          .then(() => {
            screamData.likeCount++;
            screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            res.json(screamData);
          });
      } else {
        res.status(400).json({ error: "scream already liked" });
      }
    })
    .catch(error => {
      console.log("error liking scream", error);
      res.status(500).json({ error });
    });
};

exports.unlikeScream = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("screamId", "==", req.params.screamId)
    .limit(1);

  const screamDocument = db.doc(`screams/${req.params.screamId}`);

  let screamData;
  screamDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "scream not found" });
      }
    })
    .then(data => {
      if (!data.empty) {
        let likeId;
        //TODO: find a better way, not able to use data[0].id
        data.forEach(doc => {
          likeId = doc.id;
        });

        db.doc(`/likes/${likeId}`)
          .delete()
          .then(() => {
            screamData.likeCount--;
            screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            res.json(screamData);
          });
      } else {
        res.status(400).json({ error: "scream already not liked" });
      }
    })
    .catch(error => {
      console.log("error unliking scream", error);
      res.status(500).json({ error });
    });
};
