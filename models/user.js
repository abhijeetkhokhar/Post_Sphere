const mongoose = require("mongoose");

mongoose
  .connect(
    process.env.MONGO_URI
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
  profilePhoto: { type: String, default: '' },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  resetToken: String,
  resetTokenExpiry: Date,
});


module.exports = mongoose.model("user", userSchema);
