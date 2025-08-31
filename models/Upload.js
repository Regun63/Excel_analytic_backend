import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User reference is required"]
  },

  originalName: {
    type: String,
    required: [true, "Original file name is required"],
    trim: true,
    minlength: [3, "File name must be at least 3 characters"],
    maxlength: [255, "File name can't exceed 255 characters"]
  },

  storedFileName: {
    type: String,
    required: [true, "Stored file name is required"],
    trim: true,
    minlength: [3, "Stored file name must be at least 3 characters"],
    maxlength: [255, "Stored file name can't exceed 255 characters"]
  },

  fileType: {
    type: String,
    default: 'xlsx',
    enum: {
      values: ['xlsx', 'xls', 'csv','vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'vnd.ms-excel'],
      message: 'Invalid file type: {VALUE}'
    }
  },

  rawData: {
    type: Array,
    required: [true, "Parsed data is required"],
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: "Parsed data must be a non-empty array"
    }
  },

  headers: {
    type: [String],
    required: [true, "Headers are required"],
    validate: {
      validator: (v) => Array.isArray(v) && v.length >= 2,
      message: "There must be at least two columns (X and Y)"
    }
  },
  charts:[{
  selectedX: {
    type: String,
    trim: true,
    default: null,
      required: [true, "X-axis column is required"],
    maxlength: [100, "X-axis column name is too long"]
  },

  selectedY: {
    type: String,
    trim: true,
    default: null,
      required: [true, "Y-axis column is required"],
    maxlength: [100, "Y-axis column name is too long"]
  },

  chartType: {
    type: String,
    enum: {
      values: ['bar', 'line', 'pie', 'scatter', '3d-column'],
      message: ' This not a valid chart type'
    },
    default: 'bar'
  },

  aiSummary: {
    type: String,
    trim: true,
    maxlength: [2000, "AI summary is too long"],
    default: null
  },
createdAt: {
  type: Date,
  default: Date.now
}
}]
}, {
  timestamps: true
});

const Upload= mongoose.model('Upload', uploadSchema);
export default Upload;
