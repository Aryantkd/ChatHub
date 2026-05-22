// src/middleware/authenticate.js
import { verifyAccessToken } from '../helper/token.js';
import User from '../models/user.js';

/**
 * Authenticates user using Bearer token from Authorization header.
 * Attaches user object to req.user if valid.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token. User not found.' });
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      return res.status(403).json({ success: false, message: `Account is ${user.accountStatus}.` });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export default authenticate;