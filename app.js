require("dotenv").config();
const User = require("./models/User");

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const compression = require("compression");
const helmet = require("helmet");
const RateLimit = require("express-rate-limit");

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const flash = require("connect-flash");

const indexRouter = require("./routes/indexRouter");
const messageRouter = require("./routes/messageRouter");

const app = express();
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(helmet());
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});
const excludeFromRateLimit = (req, res, next) => {
  const excludedPaths = ["/avatars", "/images", "/javascripts"];
  const isExcluded = excludedPaths.some((path) => req.url.startsWith(path));
  if (isExcluded) {
    next();
  } else {
    limiter(req, res, next);
  }
};
app.use(excludeFromRateLimit);

app.use(
  session({ secret: process.env.SS, resave: false, saveUninitialized: true })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use(compression());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// user routes
app.use("/", indexRouter);
app.use("/tms-mms", messageRouter);

// database setup
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const mongoDB = process.env.DBCS;
main().catch((err) => console.error(err));
async function main() {
  await mongoose.connect(mongoDB);
}

// setting up LocalStrategy
// called when we use the passport.authenticate()
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ email: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      if (user.status == "banned") {
        return done(null, false, { message: "You are BANNED from T&M" });
      }
      const match = await bcrypt.compare(password, user.hash);
      if (!match) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);
//define what bit of information passport
//is looking for when it creates the cookie
passport.serializeUser((user, done) => {
  done(null, user.id);
});
// define what bit of information passport
// is looking for when it  decodes the cookie
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
