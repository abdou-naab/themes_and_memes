const express = require("express");
const router = express.Router();
const {
  signup_post,
  login_post,
  update_avatar_post,
} = require("../controllers/userController");
const passport = require("passport");

router.get("/", function (req, res, next) {
  const logged = req.isAuthenticated();
  res.render("index", { logged });
});
router.get("/signup", function (req, res, next) {
  res.render("signup-form");
});
router.post("/signup", signup_post);

router.get("/login", function (req, res, next) {
  if (req.isAuthenticated()) res.redirect("/tms-mms");
  res.render("login-form");
});
router.post("/login", login_post);
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
router.post("/update-avatar", update_avatar_post);
module.exports = router;
