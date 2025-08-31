import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
   
    const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: 'User not authenticated!',
                success: false,
            });
        }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found, invalid token' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Not authorized, token failed', error: err.message });
  }
};
export const adminOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export const superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Super Admin access required" });
  }
  next();
};
