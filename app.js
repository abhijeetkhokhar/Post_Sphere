require('dotenv').config();
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const userModel = require("./models/user");
const postModel = require("./models/post");

// Multer setup for profile photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/images'));
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').pop();
    cb(null, req.user.userid + '-' + Date.now() + '.' + ext);
  }
});
const upload = multer({ storage: storage });
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("app");
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
      res.redirect("/login");
    });
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

// Forgot Password - GET
app.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { message: null });
});

// Nodemailer setup
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // replace with your email
    pass: process.env.EMAIL_PASS || 'your-app-password',    // replace with your app password
  },
});

// Forgot Password - POST
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return res.render("forgot-password", { message: "No user found with that email." });
  }
  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour
  await user.save();

  // Send email with reset link
  const resetUrl = `http://${req.headers.host}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  const mailOptions = {
    to: user.email,
    from: 'no-reply@postsphere.com',
    subject: 'Password Reset',
    html: `<p>You requested a password reset for PostSphere.</p>
           <p>Click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 1 hour.</p>`
  };
  try {
    await transporter.sendMail(mailOptions);
    res.render("forgot-password", { message: "Password reset link sent to your email." });
  } catch (err) {
    res.render("forgot-password", { message: "Error sending email. Please try again later." });
  }
});

// Reset Password - GET
app.get("/reset-password", async (req, res) => {
  const { token, email } = req.query;
  if (!token || !email) {
    return res.render("reset-password", { message: "Invalid or expired reset link." });
  }
  const user = await userModel.findOne({ email, resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
  if (!user) {
    return res.render("reset-password", { message: "Invalid or expired reset link." });
  }
  res.render("reset-password", { message: null, email, token });
});

// Reset Password - POST
app.post("/reset-password", async (req, res) => {
  const { email, password, token } = req.body;
  const user = await userModel.findOne({ email, resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
  if (!user) {
    return res.render("reset-password", { message: "Invalid or expired reset link." });
  }
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      user.password = hash;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();
      res.render("reset-password", { message: "Password updated. You can now log in." });
    });
  });
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) res.status(500).send("u must login first");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
      res.cookie("token", token);
      res.status(200).redirect("/posts");
    } else res.redirect("/login");
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

// PROFILE ROUTES
app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  res.render("profile", { user });
});

app.post("/profile/photo", isLoggedIn, upload.single("profilePhoto"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }
  await userModel.findByIdAndUpdate(req.user.userid, {
    profilePhoto: '/images/' + req.file.filename
  });
  res.redirect("/profile");
});

app.post("/profile/update", isLoggedIn, async (req, res) => {
  const { name, age } = req.body;
  await userModel.findByIdAndUpdate(req.user.userid, { name, age });
  res.redirect("/profile");
});

// POSTS ROUTES
app.get("/posts", isLoggedIn, async (req, res) => {
  let user = await userModel.findById(req.user.userid);
  let posts = await postModel.find({ user: user._id }).populate("user");
  res.render("posts", { user, posts });
});

app.post("/posts", isLoggedIn, async (req, res) => {
  let user = await userModel.findById(req.user.userid);
  let { content } = req.body;
  let post = await postModel.create({
    user: user._id,
    content,
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/posts");
});

app.get("/like/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  if (post.likes.indexOf(req.user.userid) == -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }
  await post.save();
  res.redirect("/posts");
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  res.render("edit", { post });
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
  let post = await postModel
    .findOneAndUpdate({ _id: req.params.id }, { content: req.body.content })
    .populate("user");
  res.redirect("/posts");
});

app.post("/delete/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id });
  if (post.user.toString() === req.user.userid) {
    await postModel.deleteOne({ _id: req.params.id });
    await userModel.updateOne(
      { _id: req.user.userid },
      { $pull: { posts: req.params.id } }
    );
    res.redirect("/posts");
  } else {
    res.status(403).send("Unauthorized to delete this post");
  }
});

function isLoggedIn(req, res, next) {
  if (!req.cookies.token) res.redirect("/login");
  else {
    let data = jwt.verify(req.cookies.token, "shhhh");
    req.user = data;
    next();
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
