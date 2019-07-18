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
