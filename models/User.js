const mongoose = require("mongoose");
const Schema = mongoose.Schema;
uniqueValidator = require("mongoose-unique-validator");

const userSchema = new Schema({
  firstName: { type: String, required: true, minLength: 2, maxLength: 21 },
  lastName: { type: String, minLength: 2, maxLength: 21 },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, "can't be blank"],
    uniqueCaseInsensitive: true,
    index: true,
  },
  hash: { type: String, required: true },
  status: {
    type: String,
    enum: ["admin", "validated", "unknown", "banned", "requesting_validation"],
    required: true,
    default: "unknown",
  },
  messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
  avatar_id: { type: String, default: "guest", required: true },
  lastPostDate: {
    type: Date,
    default: Date.now, // set default value to current date/time
    required: true,
  },

  postCount: {
    type: Number,
    default: 0,
    required: true,
  },
});

userSchema.virtual("fullName").get(function () {
  return this.firstName + " " + this.lastName;
});

userSchema.plugin(uniqueValidator, {
  message: "is already taken.",
  type: "mongoose-unique-validator",
});

module.exports = mongoose.model("User", userSchema);
