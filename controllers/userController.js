import User from '../models/User.js';
import Upload from '../models/Upload.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import getDataUri from '../utils/datauri.js'
import nodemailer from "nodemailer";
import cloudinary from "cloudinary";
import AdminRequest from '../models/SuperAdmin.js'
import dotenv from "dotenv";
dotenv.config();
//register controller
export const registerUser=async(req,res)=>{
 try {
    const {username,password,email,role}=req.body;

    const isUserRegistered=await User.findOne({email});
    if(isUserRegistered) return res.status(401).json({message:"Use a different email ID.",success:false});

    const hashedPass=await bcrypt.hash(password,10);
    const newUser=await  User.create({
        username,
        password:hashedPass,
        email,
        role,
    });

    const token=jwt.sign({id:newUser._id,role:newUser.role},process.env.JWT_SECRET_KEY,{ expiresIn: '3d'});
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, 
      sameSite: "None", 
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    return res.status(201).json({message:"User is successfully registered!",token,success:true});
 } catch (error) {
   return res.status(500).json({message:"Error in registering",error:error.message});
 }
};
//Login controller
export const loginUser = async (req, res) => {
  try {
    const { email, password, mode } = req.body;

    console.log("Login attempt:", { email, mode });

    // make sure password is selected
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid user" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token=jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET_KEY,{ expiresIn: '3d'});
    res.cookie("token", token, {
      httpOnly: true,
         secure: true, 
      sameSite: "None", 
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    // If user wants to log in as "admin"
    if (mode === "admin") {
  if (["admin"].includes(user.role?.toLowerCase())) {
    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      user,
      token,
    });
  } 
   else if (["superadmin"].includes(user.role?.toLowerCase())) {
    return res.status(200).json({
      success: true,
      message: "SuperAdmin login successful",
      user,
      token,
    });
  } 
  else {
     await AdminRequest.create({ user: user._id, email: user.email });

      // Send email to superadmin
      
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: `"Excel Analytics App" <${process.env.EMAIL_USER}>`,
        to: process.env.SUPERADMIN_EMAIL, // superadmin’s email
        subject: "Admin Approval Request",
        text: `User ${user.email} is requesting admin access. Please review in the dashboard.`,
      });

       user.adminApprovalPending = true;
       await user.save();
      return res.status(403).json({
        success: false,
        message: "Your request has been sent to the Superadmin for approval.",
      });
  }
}
    return res.status(200).json({
      success: true,
      message: "User login successful",
      user,
    });

  } catch (error) {
    console.error("🔥 Login error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const logout=async(_,res)=>{
    try {
        return res.cookie("token","",{maxAge:0}).json({
            message:"Logged out successfully.",
            success:true,
        })
    } catch (error) {
       console.log(error); 
    }
};

// controllers/userController.js
export const requestAdminAccess = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.role === "admin" || user.role === "superadmin") {
      return res.status(400).json({ message: "You are already an admin" });
    }

    if (user.adminRequestStatus === "pending") {
      return res.status(400).json({ message: "Request already pending" });
    }

    user.adminRequestStatus = "pending";
    await user.save();

    res.json({ message: "Request sent to Super Admin for approval" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// controllers/superAdminController.js
export const handleAdminRequest = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Super Admin access required" });
    }

    const { userId, action } = req.body; // 'approve' | 'reject'
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (action === "approve") {
      user.role = "admin";
      user.adminRequestStatus = "approved";
    } else {
      user.adminRequestStatus = "rejected";
    }

    await user.save();
    res.json({ message: `Request ${action}d successfully` });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const sendVerificationCode=async(req,res)=>{
    try{
    const user=await User.findById(req.user.id);
    if(!user)return res.status(404).json({message:"User Not Found!",success:false});
    const code=Math.floor(100000 + Math.random() * 900000);
    user.verificationCode=code;
    user.verificationCodeValidation = Date.now() + 5 * 60 * 1000; //active upto 5 min.
    await user.save();


    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,      
        pass: process.env.EMAIL_PASS,      
      },
    });

  await transporter.sendMail({
      from: `Excel Analytics Team ${process.env.EMAIL_USER}`,
      to: user.email,
      subject: "Your Verification Code",
      text: `Hello ${user.username} Welcome to the Ecxel Analysis Platform \nPlease verify your email \n\nYour verification code is: ${code}\n\nThis code will expire in 5 minutes.\n\n This is an auto generated mail, Please don't reply.`,
    },(err, info) => {
  if (err) {
    console.error(" Email error:", err);
  } else {
    console.log(" Email sent:", info.response);
  }
});

   
   return res.status(200).json({message:"Verification Code is sent to your registered email.",success:true})
    }catch(err){
      return  res.status(500).json({error:err.message});
    }

}
//verify the user....
export const verifyUser = async (req, res) => {
    try{
  const { code } = req.body;
  const user = await User.findById(req.user.id);

  if (!user || user.verificationCode !== Number(code)) {
    return res.status(400).json({ message: "Invalid verification code",success:false });
  }

  if (user.verificationCodeValidation < Date.now()) {
    return res.status(400).json({ message: "Verification code expired",success:false });
  }

  user.verified = true;
  user.verificationCode = undefined;
  user.verificationCodeValidation = undefined;
  await user.save();

  return res.status(200).json({ message: "User verified successfully!",success:true });
}catch(err){
    return  res.status(501).json({ message: "Error in User verification." });
}
};
//forgetPassword Code...
export const sendResetCode = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" ,success:false});

  const code = Math.floor(100000 + Math.random() * 900000);
  user.forgetPasswordCode = code;
  user.forgetPasswordCodeValidation = Date.now() + 10 * 60 * 1000;
  await user.save();

 return res.status(200).json({ message: "Reset code sent to your email",success:true });
};

//reseting password..........
export const resetPassword  = async (req, res) => {
try{
  const { confirmPass,newPassword,code,email } = req.body;
  const user=User.findOne({email});
  if(!user) res.status(404).json({message:"User Not Found!",success:false});
  if(newPassword!=confirmPass ||user.forgetPasswordCode!=Number(code) )
   return res.status(400).json({message:"Invalid Code or password is not confirmed.",success:false})
  if(user.forgetPasswordCodeValidation<Date.now())
   return res.status(400).json({message:"Session is expired.",success:false})

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  user.forgetPasswordCode = undefined;
  user.forgetPasswordCodeValidation = undefined;
  await user.save();
  return res.status(200).json({ message: "Password has been reset" ,success:true});
}catch(err){
   return  res.status(501).json({error:err.message });
}
};

export const getProfile = async (req, res) => {
  try {
    const uploads = await Upload.find({ user: req.user.id })
      .populate('user', 'username email profilePicture role');
    return res.status(200).json({ success: true, uploads });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching uploads', error: error.message });
  }
};

export const editProfile = async (req, res) => {
   try {
      const userID = req.user._id;
      const { role, email, username } = req.body;
      const profilePicture = req.file;
      let cloudResponse;
  
      if (profilePicture) {
        const fileUri = getDataUri(profilePicture);
        cloudResponse = await cloudinary.uploader.upload(fileUri);
      }
  
      const user = await User.findById(userID).select("-password");
      if (!user) {
        return res.status(404).json({
          message: "User not found.",
          success: false,
        });
      }
    if (role) { 
      if (user.role==='admin') { 
        if (role === 'user') {
            return res.status(403).json({ 
                message: "Admins cannot change their own role to 'User'.",
                success: false 
            });
        }
        
        user.role = (role );
    }
}
      if (email) user.email = email;
      if (username) user.username = username;
      if (cloudResponse) {
        user.profilePicture.url = cloudResponse.secure_url;
        user.profilePicture.fileType = cloudResponse.format; 
      }
      await user.save();
  
      return res.status(200).json({
        message: "Profile is updated successfully.",
        success: true,
        user,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error.",
        success: false,
      });
    }
  };


//Admin profile Facility...

export const getAllProfile = async (req, res) => {
  try {
    // All uploads with user info
    const users = await Upload.find({})
      .populate("user", "username email role");

    // All users
    const allusers = await User.find({});

    // Separate admins and users
    const admins = allusers.filter(u => u.role?.toLowerCase() === "admin");
    const onlyUsers = allusers.filter(u => u.role?.toLowerCase() === "user");

    return res.status(200).json({
      success: true,
      users,      
      admins,
      onlyUsers,
      totalUsers: allusers.length,
      adminCount: admins.length,
      message: "Users fetched successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch users",
      error: err.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res
        .status(400)
        .json({ message: "Admin can't delete themselves", success: false });
    }

    // Find the user first
    const users = await User.findById(userId);
    if (!users) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // Delete all uploads of this user

    await Upload.deleteMany({ user: userId });

    // Now delete the user
    await User.findByIdAndDelete(userId);
    const newUsers=await Upload.find({});

    return res
      .status(200)
      .json({ message: `${users.role=='user'?'User and their uploads':"Admin is"}  deleted successfully`, success: true,newUsers });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to delete user", error: err.message, success: false });
  }
};


export const toggleAdmin = async (req, res) => {
  try {
    const {role,_id:id,username} = req.user; 

    if (role==='user') {
      return res.status(403).json({ message: "Only admins can toggle admin status" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.equals(id)) {
      return res.status(400).json({ message: "Admins cannot toggle their own status" });
    }

   if(user.role==='admin')user.role='user'
   else user.role='admin'
    await user.save();

   return res.status(200).json({
      message: `Admin ${username} toggled admin status for user ${user.username} to ${user.role}`,
      role: user.role,
      success:false
    });

  } catch (err) {
   return res.status(500).json({ message: "Failed to toggle admin", error: err.message });
  }
};
