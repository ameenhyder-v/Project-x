const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
require("dotenv").config();

function getCallbackURL() {
    const url = process.env.NODE_ENV === "production"
        ? (process.env.AUTHORIZED_URL || "").trim()
        : (process.env.AUTHORIZED_URL_LOCAL || "").trim();
    return url || `http://localhost:${process.env.PORT || 7999}/auth/google/callback`;
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: getCallbackURL(),
    passReqToCallback: true
},

function(request, accessToken, refreshToken, profile, done) {
    return done(null, profile);
    
}

))

