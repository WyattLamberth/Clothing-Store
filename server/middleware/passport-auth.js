const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const pool = require('../db/connection');

// Configure passport strategy
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

// Setup JWT strategy
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

// Create middleware that combines passport auth and role checking
const auth = (allowedRoles = []) => {
  return (req, res, next) => {
    // Define public paths
    const publicPaths = [
      '/api/register',
      '/api/login',
      '/api/products',
      '/api/categories'
    ];

    // Check if the path starts with any of the public paths
    if (publicPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized - No valid token' });
      }

      // Check roles if specified
      if (allowedRoles.length && !allowedRoles.includes(user.role_id)) {
        return res.status(403).json({
          message: 'Access denied',
          required: allowedRoles,
          current: user.role_id
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    })(req, res, next);
  };
};

// Helper middleware for common role patterns
const authMiddleware = {
  // Allow any authenticated user
  authenticate: auth([1, 2, 3]),
  
  // Only allow employees and admins
  staffOnly: auth([1, 2]),
  
  // Only allow admins
  adminOnly: auth([1]),
  
  // Check if user is accessing their own data
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