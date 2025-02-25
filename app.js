const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(cookieParser());
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../backendProject/models/user");
const postModel = require("../backendProject/models/post");

app.get("/register", (req, res) => {
  res.render("app");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get("/profile", isLoggedIn, (req, res) => {
  console.log(req.user);
  res.send("profile page");
});


app.post("/register", async (req, res) => {
  let { username, name, age, email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (user) res.status(500).send("user already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        name,
        age,
        password: hash,
        email,
      });

      let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
      res.cookie("token", token);
      res.send("registered");
    });
  });
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) res.status(500).send("Something went wrong");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
      res.cookie("token", token);
      res.status(200).send("u can login");
    } else res.redirect("/login");
  });
});


function isLoggedIn (req, res, next) {
if (req.cookie.token == " ") res.send("u must be logged in");
  else {
    let data = jwt.verify(req.cookie.token, "shhhh");
    req.user = data;
    next();
  }
};

app.listen(3000, () => {
  console.log(3000, "Server running on localhost:3000");
});
