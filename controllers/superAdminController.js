import User from '../models/User.js';
import bcrypt from "bcryptjs";
import AdminRequest from '../models/SuperAdmin.js'

export const createSuperAdmin = async () => {
  try {
    const existing = await User.findOne({ role: "superadmin" });
    if (!existing) {
    const hashed = await bcrypt.hash(process.env.SUPERADMIN_PASS, 10);
        await User.create({
        username: "superadmin",
        email: process.env.SUPERADMIN_EMAIL,
        password: hashed,
        role: "superadmin",
        verified: true,
        });

      console.log(" Superadmin created!");
    }
  } catch (err) {
    console.error("Error creating superadmin:", err.message);
  }
};

// Get all pending requests
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await AdminRequest.find({ status: "pending" })
      .populate("user", "username email") 
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, requests });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
// Approve request
export const approveRequest = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.role = "admin";
    user.adminApprovalPending = false;
    await AdminRequest.findOneAndDelete({ user: user._id });
    await user.save();

    res.status(200).json({ success: true, message: "User promoted to admin" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Reject request
export const rejectRequest = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.role='user'
    user.adminApprovalPending = false;
      await AdminRequest.findOneAndDelete({ user: user._id });
    await user.save();

    res.status(200).json({ success: true, message: "Request rejected" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export default createSuperAdmin;