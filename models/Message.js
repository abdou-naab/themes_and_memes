const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require("luxon");

const messageSchema = new Schema(
  {
    subject: { type: String, required: true },
    content: { type: String },
    image: { type: Buffer },
    mimetype: String,
  },
  { timestamps: true }
);
//createdAt: a date representing when this document was created
// updatedAt: a date representing when this document was last updated

messageSchema.virtual("time").get(function () {
  return DateTime.fromJSDate(this.createdAt).toLocaleString(
    DateTime.DATETIME_MED
  );
});

module.exports = mongoose.model("Message", messageSchema);
