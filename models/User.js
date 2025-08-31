import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a valid username!"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [20, "Username can't be more than 20 characters"],
    match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"]
  },

  password: {
    type: String,
    required: [true,"Please provide a password!"],
    minlength: [5, "Password must be at least 5 characters!"],
    select: false,
  },
  
  email: {
    type: String,
    required: [true,"Please provide a valid email!"],
    unique: [true,"Please provide a unique email!"],
    lowercase: true,
    trim: true,
  },

  role: {
    type: String,
    enum: ["user", "admin", "superadmin"],
    default: "user"
  },

  adminApprovalPending: {
    type: Boolean,
    default: false,
  },

  verified: {
    type: Boolean,
    default: false,
  },

  verificationCode: Number,
  verificationCodeValidation: Date,
  forgetPasswordCode: Number,
  forgetPasswordCodeValidation: Date,

  profilePicture: {
    url: {
      type: String,
      default: "", 
    },
    fileType: {
      type: String,
      enum: {
        values: ['jpeg', 'jpg', 'png', 'image/jpeg', 'image/png'],
        message: 'Invalid image file type: {VALUE}'
      },
      default: 'image/jpeg'
    }
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
