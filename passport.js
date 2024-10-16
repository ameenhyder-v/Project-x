const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
require("dotenv").config();

passport.serializeUser((user,done) => {
    done(null, user);
})

passport.deserializeUser(function (user, done){
    done(null, user);
})

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.AUTHORIZED_URL,
    passReqToCallback: true
},

function(request, accessToken, refreshToken, profile, done) {
    return done(null, profile);
    
}

))

