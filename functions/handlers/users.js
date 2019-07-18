const { db, admin } = require("../util/admin");
const config = require("../util/config");
const firebase = require("firebase");
const {
  validateSignUpData,
  validateLoginData,
  validateImageType
} = require("../util/validators");

firebase.initializeApp(config);

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  const errors = validateSignUpData(newUser);
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${
          config.storageBucket
        }/o/no-img.png?alt=media`,
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
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  const errors = validateLoginData(user);
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(error => {
      console.error("error login", error);
      if (error.code === "auth/wrong-password") {
        return res
          .status(403)
          .json({ general: "wrong credentials, please try again" });
      } else return res.status(500).json({ error: error.code });
    });
};

exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let imageToBeUploaded = {};

  busboy.on("file", (field, file, fileName, encoding, mimeType) => {
    if (!validateImageType(mimeType)) {
      return res
        .status(400)
        .json({ error: "image file should be jpeg or png" });
    }

    let fileNameParts = fileName.split(".");
    const imageExtension = fileNameParts[fileNameParts.length - 1];
    imageFileName = `${Math.round(
      Math.random() * 100000000
    )}.${imageExtension}`;
    const filePath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filePath, mimeType };
    file.pipe(fs.createWriteStream(filePath));
  });

  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimeType
          }
        }
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
          config.storageBucket
        }/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "image uploaded successfully" });
      })
      .catch(error => {
        console.error("error uploading image", error);
        res.status(500).json(error);
      });
  });
  busboy.end(req.rawBody);
};
