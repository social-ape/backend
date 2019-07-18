const { admin, db } = require("./admin");

module.exports = (req, res, next) => {
  let token = req.headers.authorization;
  if (token && token.startsWith("Bearer ")) {
    token = token.split("Bearer ")[1];
  } else {
    console.error("No token found");
    res.status(403).json({ error: "unauthoized" });
  }

  admin
    .auth()
    .verifyIdToken(token)
    .then(userData => {
      req.user = userData;
      console.log("decoded token : ", userData);
      return db
        .collection("users")
        .where("userId", "==", userData.uid)
        .limit(1)
        .get();
    })
    .then(user => {
      req.user.handle = user.docs[0].data().handle;
      req.user.imageUrl = user.docs[0].data().imageUrl;
      return next();
    })
    .catch(error => {
      console.error("error while verifying token", error);
      return res.status(403).json(error);
    });
};
