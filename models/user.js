const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://abhijeetkhokhar01:lp52xSX5IEY9Uw2u@cluster0.x3xunis.mongodb.net/miniProject"
  )
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.log(error);
  });

const userSchema = mongoose.Schema({
  username: String,
  name: String,
  age: Number,
  email: String,
  password: String,
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
});

module.exports = mongoose.model("user", userSchema);
