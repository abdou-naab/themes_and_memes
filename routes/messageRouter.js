const express = require("express");
const router = express.Router();
const {
  upload_message_get,
  upload_message_post,
  message_delete_get,
  message_delete_post,
  user_ban_get,
  user_ban_post,
  request_update,
  message_pin,
} = require("../controllers/messageController");

router.get("/", upload_message_get);
router.post("/", upload_message_post);
router.get("/msg/delete/:message_id", message_delete_get);
router.post("/msg/delete/:message_id", message_delete_post);
router.post("/msg/pin/:message_id", message_pin);
router.get("/user/ban/:user_id", user_ban_get);
router.post("/user/ban/:user_id", user_ban_post);
router.get("/request_update/:user_id", request_update);
module.exports = router;
