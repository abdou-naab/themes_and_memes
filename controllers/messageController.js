const Message = require("../models/Message");
const User = require("../models/User");
const multer = require("multer");
const { Buffer } = require("node:buffer");
require("dotenv").config();
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const he = require("he");

const validateReq = [
  upload.single("image_upload"),
  body("subject", "you must enter a subject")
    .trim()
    .isLength({ min: 2, max: 25 })
    .withMessage("enter a subject between 2 and 25 characters")
    .escape(),
  body("content")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 2, max: 3000 })
    .withMessage("enter at least 2 characters for the content (3000 max)")
    .escape(),
  body("image_upload")
    .optional({ values: "falsy" })
    .custom((v, { req }) => {
      return ["image/jpg", "image/jpeg", "image/png"].includes(
        req.file.mimetype
      );
    })
    .withMessage("enter a valid image format (jpg|png|jpeg)"),
];
exports.upload_message_post = [
  validateReq,
  asyncHandler(async (req, res, next) => {
    const logged = req.isAuthenticated();
    const errors = validationResult(req);
    req.body.subject = req.body.subject
      .replace(/ +/g, " ")
      .replace(/\r?\n|\r/g, "\n")
      .replace(/\n+/g, "\n");
    req.body.content = req.body.content
      .replace(/ +/g, " ")
      .replace(/\r?\n|\r/g, "\n")
      .replace(/\n+/g, "\n");
    const message = new Message({
      subject: req.body.subject,
      content: req.body.content,
    });
    if (req.file) {
      message.image = req.file.buffer;
      message.mimetype = req.file.mimetype;
    }
    let user = await User.findById(req.user._id).exec();
    const canPost = await handleUnknownUsersPostLimit(user);
    if (!errors.isEmpty() || !canPost) {
      const messages = await getMessagesPlus(logged, req);
      if (!canPost) {
        errors.errors.push({
          msg: "you have only 2 possible posts / day as an unknown. request an upgrade!",
        });
      }
      res.render("messages", {
        logged,
        errors: errors.array(),
        messages,
        status: req.user && req.user.status,
        curr_user: req.user,
      });
    } else {
      user = canPost || user;
      user.messages.push(message._id);
      await message.save();
      await user.save();
      res.redirect("/tms-mms");
    }
  }),
];
exports.upload_message_get = asyncHandler(async (req, res, next) => {
  const logged = req.isAuthenticated();
  const messages = await getMessagesPlus(logged, req);
  res.render("messages", {
    logged,
    messages,
    status: req.user && req.user.status,
    curr_user: req.user,
  });
});

exports.message_delete_get = asyncHandler(async (req, res, next) => {
  const logged = req.isAuthenticated();
  if (!logged) {
    return res.redirect("/");
  }
  const message_to_delete = await Message.findById(req.params.message_id);
  if (message_to_delete.image) {
    const imageBase64 = Buffer.from(message_to_delete.image).toString("base64");
    message_to_delete.imageDataUrl =
      `data:${message_to_delete.mimetype};base64,` + imageBase64;
  }
  if (logged) {
    const user = await User.findOne(
      { messages: message_to_delete._id },
      "_id firstName lastName status avatar_id"
    ).exec();
    message_to_delete.user = user;
  }
  res.render("message_delete", {
    logged,
    message_to_delete,
    curr_user: req.user,
  });
});
exports.message_delete_post = asyncHandler(async (req, res, next) => {
  const { user_id } = req.body;
  const message_id = req.params.message_id;
  await Message.findByIdAndDelete(message_id);
  await User.findByIdAndUpdate(user_id, { $pull: { messages: message_id } });
  res.redirect("/tms-mms");
});
exports.user_ban_get = asyncHandler(async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }
  const user = await User.findById(req.params.user_id).exec();
  res.render("ban_user", {
    user,
    curr_user: req.user,
    logged: req.isAuthenticated(),
  });
});
exports.user_ban_post = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.user_id, {
    status: "banned",
  });
  if (user && user.messages) {
    await Promise.all(
      user.messages.map(async (message_id) => {
        await Message.findByIdAndDelete(message_id);
      })
    );
  }
  res.redirect("/tms-mms");
});
exports.request_update = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.user_id, {
    status: "requesting_validation",
  });
  res.redirect("/tms-mms");
});

const getMessagesPlus = async (logged, req) => {
  const messages = await Message.find()
    .sort({ updatedAt: 1, createdAt: 1 })
    .exec();
  for (const message of messages) {
    // display special characters
    message.subject = he.decode(message.subject);
    message.content = he.decode(message.content);
    if (message.image) {
      const imageBase64 = Buffer.from(message.image).toString("base64");
      message.imageDataUrl = `data:${message.mimetype};base64,` + imageBase64;
    }
    if (logged) {
      const user = await User.findOne(
        { messages: message._id },
        "_id firstName lastName status avatar_id"
      ).exec();
      message.user = user;
      message.mine = message.user._id.toString() == req.user._id.toString();
    }
  }
  return messages;
};

const handleUnknownUsersPostLimit = (user) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (user.status != "admin" && user.status != "validated") {
    if (user.lastPostDate < today) {
      user.postCount = 1;
      user.lastPostDate = today;
    } else if (user.postCount < 2) {
      user.postCount = user.postCount + 1;
    } else {
      return false;
    }
  }
  return user;
};
