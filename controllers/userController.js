const User = require("../models/User");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const passport = require("passport");

const validateReq = [
  body("fname", "you must enter your first name")
    .trim()
    .isLength({ min: 2, max: 25 })
    .withMessage("enter a valid first name")
    .escape(),
  body("lname")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 1, max: 25 })
    .withMessage("enter a valid last name")
    .escape(),
  body("username", "you must enter a valid email").trim().isEmail().escape(),
  body("password", "you must enter a password")
    .isLength({ min: 8 })
    .withMessage("password's length must be at least 8")
    .escape(),
  body("confirmPassword", "passwords doesn't match").custom(
    (v, { req }) => v == req.body.password
  ),
];

exports.signup_post = [
  ...validateReq,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    try {
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) return next(err);
        else {
          const userExists = await User.findOne({
            email: req.body.username,
          }).exec();
          const user = new User({
            firstName: req.body.fname,
            lastName: req.body.lname,
            email: req.body.username,
            hash: hashedPassword,
            avatar_id: req.body.avatar_id,
          });
          if (!errors.isEmpty() || userExists) {
            errors.errors.push({ msg: "you already used this email!" });
            res.render("signup-form", {
              errors: errors.array(),
              user,
            });
          } else {
            const result = await user.save();
            res.redirect("/login");
          }
        }
      });
    } catch (err) {
      return next(err);
    }
  }),
];

exports.login_post = [
  body("username", "you must enter a valid email").trim().isEmail().escape(),
  body("password", "you must enter a password").not().isEmpty().escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("login-form", {
        errors: errors.array(),
      });
    } else {
      passport.authenticate("local", function (err, user, info) {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.render("login-form", {
            username: req.body.username,
            errors: [{ msg: info.message }],
          });
        }
        req.logIn(user, function (err) {
          if (err) {
            return next(err);
          }
          return res.redirect("/tms-mms");
        });
      })(req, res, next);
    }
  }),
];

exports.update_avatar_post = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const avatar_id = req.body.avatar_id;

  await User.findByIdAndUpdate(userId, { avatar_id });

  res.status(200).json({ message: "Avatar updated successfully" });
});
