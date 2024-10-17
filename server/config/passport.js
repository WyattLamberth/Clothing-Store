const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const pool = require('../db/connection');

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(options, async (jwt_payload, done) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE user_id = ?', [jwt_payload.userId]);
    if (rows.length > 0) {
      return done(null, rows[0]);
    } else {
      return done(null, false);
    }
  } catch (error) {
    return done(error, false);
  }
}));

module.exports = passport;
