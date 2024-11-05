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

const auth = (allowedRoles = []) => {
  return (req, res, next) => {
    const publicPaths = [
      '/api/register',
      '/api/login',
      '/api/products',
      '/api/categories'
    ];

    if (publicPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      console.log("User info in auth middleware:", user);  // Log user info
    
      if (err) {
        return res.status(500).json({ message: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized - No valid token' });
      }

      console.log("User role:", user.role_id, "Allowed roles:", allowedRoles);
    
      if (allowedRoles.length && !allowedRoles.includes(user.role_id)) {
        console.log(`Access denied for user with role_id ${user.role_id}`);
        return res.status(403).json({
          message: 'Access denied',
          required: allowedRoles,
          current: user.role_id
        });
      }
    
      req.user = user;
      next();
    })(req, res, next);
    
  };
};

const authMiddleware = {
  authenticate: auth([1, 2, 3]),
  staffOnly: auth([2,3]),
  adminOnly: auth([3]),
  customerOnly: auth([1,2,3]),  // This middleware will only allow role_id of 1

  checkSelfOrHigher: (req, res, next) => {
    const userId = req.params.userId || req.params.customerId;
    if (!userId) return next();
    
    if (req.user.role_id === 3 || req.user.userId === parseInt(userId)) {
      return next();
    }
    
    if (req.user.role_id === 2 && req.method === 'GET') {
      return next();
    }
    
    res.status(403).json({ message: 'Access denied to this resource' });
  }
};

module.exports = { passport, authMiddleware };
