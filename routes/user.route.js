import express from "express";
import upload from "../middleware/multer.js";
import {authMiddleware,adminOnly} from '../middleware/authMiddleware.js'
import {
  registerUser,
  loginUser,
  getProfile,
  editProfile,
  sendVerificationCode,
  verifyUser,
  sendResetCode,
  resetPassword,
  getAllProfile,
  deleteUser,
  toggleAdmin,
  logout,
  requestAdminAccess, handleAdminRequest
} from '../controllers/userController.js'

const router=express.Router();
router.route('/signup').post(registerUser);
router.route('/login').post(loginUser);
router.route("/profile").get(authMiddleware,getProfile);
router.route("/edit").post(authMiddleware,upload.single("profilePicture"),editProfile);
router.route("/logout").get(logout);
router.post('/send-verification-code', authMiddleware, sendVerificationCode);
router.post('/verify-user', authMiddleware, verifyUser);
router.post('/send-reset-code', sendResetCode);
router.post('/reset-password', resetPassword);

// Admin Routes
router.get('/all', authMiddleware,adminOnly, getAllProfile); 
router.delete('/:id', authMiddleware,adminOnly, deleteUser); 
router.patch('/toggle-admin/:id', authMiddleware,adminOnly, toggleAdmin);

export default router;