const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("./models/User.js");
const Message = require("./models/Message.js");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const ws = require("ws");
const fs = require("fs");
const path = require("path");

dotenv.config();
mongoose.connect(process.env.MONGO_URL);
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname + "/uploads")));
app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

app.get("/", (req, res) => {
  res.json("test ok");
});

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) {
        return res.status(401).json({ error: "Invalid token" });
      }
      res.json(userData);
    });
  } else {
    res.status(401).json({ error: "No token provided" });
  }
});

async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) {
          reject("Invalid token");
        }
        resolve(userData);
      });
    } else {
      reject("No token provided");
    }
  });
}

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;

    const messages = await Message.find({
      sender: { $in: [userId, ourUserId] },
      recipient: { $in: [userId, ourUserId] },
    })
      .sort({ createdAt: 1 })
      .populate("sender")
      .populate("recipient");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "An error occured while fetching messages" });
  }
});

app.get("/people", async (req, res) => {
  try {
    const users = await User.find({}, { _id: 1, username: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "An error occured while fetching the user" });
  }
});

// app.post("/login", async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const foundUser = await User.findOne({ username });
//     if (foundUser) {
//       const passOk = bcrypt.compareSync(password, foundUser.password);
//       if (passOk) {
//         jwt.sign(
//           { userId: foundUser._id, username },
//           jwtSecret,
//           {},
//           (err, token) => {
//             if (err) {
//               return res.status(500).json({ error: "Error generating token" });
//             }
//             res
//               .cookie("token", token, { sameSite: "none", secure: true })
//               .json({
//                 id: foundUser._id,
//               });
//           }
//         );
//       } else {
//         res.status(401).json({ error: "Invalid password" });
//       }
//     } else {
//       res.status(401).json({ error: "User not found" });
//     }
//   } catch (error) {
//     res.status(500).json({ error: "An error occured during login" });
//   }
// });

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const foundUser = await User.findOne({ username });
    if (foundUser) {
      const passOk = bcrypt.compareSync(password, foundUser.password);
      if (passOk) {
        jwt.sign(
          { userId: foundUser._id, username },
          jwtSecret,
          { expiresIn: "1h" }, // Add an expiration time for security
          (err, token) => {
            if (err) {
              console.error("JWT Error:", err); // Log the error for debugging
              return res.status(500).json({ error: "Error generating token" });
            }
            res
              .cookie("token", token, { sameSite: "none", secure: true })
              .json({ id: foundUser._id });
          }
        );
      } else {
        res.status(401).json({ error: "Invalid password" });
      }
    } else {
      res.status(401).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Login Error:", error); // Log the error for debugging
    res.status(500).json({ error: "An error occurred during login" });
  }
});

app.post("/logout", (req, res) => {
  res
    .cookie("token", "", {
      sameSite: "none",
      secure: true,
      expires: new Date(0),
    })
    .json("ok");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);

    // Create the user
    const createdUser = await User.create({
      username: username,
      password: hashedPassword,
    });
    res.status(200).json({ message: "Created successfully", id : createdUser._id });

    // Sign the JWT
    // jwt.sign(
    //   { userId: createdUser._id, username },
    //   jwtSecret,
    //   {},
    //   (err, token) => {
    //     if (err) {
    //       return res.status(500).json({ error: "Error generating the token" });
    //     }

    //     // Set the cookie and respond
    //     res
    //       .cookie("token", token, { sameSite: "none", secure: true })
    //       .status(201)
    //       .json({
    //         id: createdUser._id,
    //         message: "User created successfully!",
    //       });
    //   }
    // );
  } catch (error) {
    res.status(500).json({ error: "An error occured during the registration" });
  }
});

// const port = process.env.PORT || 4000;
const server = app.listen(4040);

const wss = new ws.WebSocketServer({ server });
wss.on("connection", (connection, req) => {
  function notifyAboutOnlinePeople() {
    wss.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            userId: c.userId,
            username: c.username,
          })),
        })
      );
    });
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
      console.log("dead");
    }, 1000);
  }, 3000);

  connection.on("pong", () => {
    clearTimeout(connection.deathTimer);
  });

  // Read username and id  from the cookie for this connection
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));
    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }

  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    const { recipient, text, file } = messageData;
    let filename = null;
    if (file) {
      const parts = file.name.split(".");
      const ext = parts[parts.length - 1];
      filename = Date.now() + "." + ext;
      const filePath = path.join(__dirname + "/uploads/" + filename);
      const bufferData = Buffer.from(file.data.split(",")[1], "base64");

      fs.writeFile(filePath, bufferData, (err) => {
        if (err) {
          console.error("Error saving file:", err);
          return res.status(500).json({ message: "Error saving file" });
        }
        console.log("file saved:" + filePath);
      });
    }
    if (recipient && (text || file)) {
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
        file: file ? filename : null,
      });
      [...wss.clients]
        .filter((c) => c.userId === recipient)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text,
              recipient,
              sender: connection.userId,
              file: file ? filename : null,
              _id: messageDoc._id,
            })
          )
        );
    }
  });

  // Notify everyone about online people (when someone connects)
  notifyAboutOnlinePeople();
});
