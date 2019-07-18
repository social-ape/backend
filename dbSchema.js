let db = {
  users: [
    {
      userId: "uid of user",
      email: "a@b.com",
      handle: "user",
      createdAt: "2019-07-18T17:21:25.798Z",
      imageUrl: "storage url",
      bio: "hey there I am computer engg",
      website: "https://a.com",
      location: "India"
    }
  ],
  screams: [
    {
      userHandle: "user",
      body: "scream body",
      createdAt: "2019-07-17T12:01:33.422Z",
      likeCount: 5,
      commentCount: 3
    }
  ]
};

const userDetails = {
  //Redux data
  credentials: {
    bio: "i am computer engg",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/...",
    createdAt: "2019-07-18T04:57:21.292Z",
    location: "Rupnagar",
    website: "https:a.com",
    handle: "user",
    email: "abc@d.com",
    userId: "5agNpkl4j6QvcIMnpUe8WtxdtEv1"
  },
  likes: [
    {
      userHandle: "user",
      screamId: "abc"
    }
  ]
};
