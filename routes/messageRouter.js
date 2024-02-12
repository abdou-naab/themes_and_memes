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
} = require("../controllers/messageController");

router.get("/", upload_message_get);
router.post("/", upload_message_post);
router.get("/msg/:message_id/delete", message_delete_get);
router.post("/msg/:message_id/delete", message_delete_post);
router.get("/user/:user_id/ban", user_ban_get);
router.post("/user/:user_id/ban", user_ban_post);
router.get("/request_update/:user_id", request_update);
module.exports = router;
