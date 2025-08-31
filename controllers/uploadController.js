import Upload from "../models/Upload.js";
import * as XLSX from "xlsx";
import axios from "axios";

export const uploadExcelFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ message: "Empty or invalid Excel file" });
    }

    const headers = Object.keys(rawData[0]);

    const uploads = await Upload.create({
      user: req.user._id,
      originalName: req.file.originalname,
      storedFileName: `mem-${Date.now()}-${req.file.originalname}`,
      fileType: req.file.mimetype.split("/")[1],
      rawData,
      headers
    });
    const allUploads = await Upload.find({ user: req.user._id }).sort({ createdAt: -1 });
   return res.status(201).json({
      message: "File uploaded and parsed successfully",
      uploadId: uploads._id,
      headers: headers,
      totalRecords: rawData.length,
      success:true,
      uploads:allUploads
    });
  } catch (err) {
    console.error("Upload error:", err.message);
  return  res.status(500).json({ message: "Upload failed", error: err.message });
  }
};


export const addChartToUpload = async (req, res) => {
  try {
    const uploadId = req.params.id;
    const { selectedX, selectedY, chartType, aiSummary } = req.body;

    if (!selectedX || !selectedY) {
      return res.status(400).json({ message: "Both selectedX and selectedY are required." });
    }

    // Validate chartType
    const validChartTypes = ['bar', 'line', 'pie', 'scatter'];
    if (chartType && !validChartTypes.includes(chartType)) {
      return res.status(400).json({ message: `Invalid chart type: ${chartType}` });
    }

    const upload = await Upload.findById(uploadId);
    if (!upload) {
      return res.status(404).json({ message: "Upload not found." });
    }
    if (!upload.headers.includes(selectedX) || !upload.headers.includes(selectedY)) {
      return res.status(400).json({ message: "Selected X or Y column does not exist in uploaded file headers." });
    }
    upload.charts.unshift({
      selectedX,
      selectedY,
      chartType: chartType || 'bar',
      aiSummary: aiSummary || null,
    });

    await upload.save();

   return res.status(201).json({
      message: "Chart added successfully.",
      charts: upload.charts,
      success:true,
    });
  } catch (err) {
    console.error("Error adding chart:", err);
   return res.status(500).json({ message: "Server error while adding chart." });
  }
};
export const generateAISummary = async (req, res) => {
  try {
    const { uploadId, chartId } = req.params;

    // Find upload & chart
    const upload = await Upload.findById(uploadId);
    if (!upload) return res.status(404).json({ error: "Upload not found" });

    const chart = upload.charts.id(chartId);
    if (!chart) return res.status(404).json({ error: "Chart not found" });

    const { selectedX, selectedY, chartType } = chart;
    const data = Array.isArray(upload.rawData) ? upload.rawData : [];

    // Start detailed summary
    let summary = `The uploaded dataset has been visualized as a ${chartType} chart, focusing on the relationship between the "${selectedX}" column (X-axis) and the "${selectedY}" column (Y-axis).`;

    if (data.length > 0) {
      const yValues = data.map(row => row[selectedY]).filter(val => typeof val === "number");
      const xValues = data.map(row => row[selectedX]);

      if (yValues.length > 0) {
        const max = Math.max(...yValues);
        const min = Math.min(...yValues);
        const avg = (yValues.reduce((a, b) => a + b, 0) / yValues.length).toFixed(2);
        const count = yValues.length;
 const uniqueX = Array.from(new Set(xValues));
    const xInfo = uniqueX.length <= 10
      ? `The X-axis has ${uniqueX.length} distinct categories: ${uniqueX.join(", ")}.`
      : `The X-axis contains ${uniqueX.length} distinct categories.`;

    summary += ` The chart is based on ${count} data points. The "${selectedY}" values range from ${min} to ${max}, with an average of ${avg}. ${xInfo}`;
    
        // Trend and variability insights
        if (chartType === "line" || chartType === "scatter") {
          summary += " Observing the trend, one can identify fluctuations, peaks, or declines in the data, which may indicate patterns or relationships between variables.";
        } else if (chartType === "bar" || chartType === "3d-column") {
          summary += " Each bar represents a category or interval of the X-axis variable, making it easier to compare values and spot which categories dominate or lag behind.";
        } else if (chartType === "pie") {
          summary += " The pie slices illustrate the proportional distribution of each category, highlighting which segments contribute most to the total.";
        }

        summary += " This visualization can aid in decision-making, revealing insights that are not immediately apparent from raw data alone.";
      } else {
        summary += " However, the selected Y-axis column contains no numeric data, so quantitative insights are limited.";
      }
    } else {
      summary += " Unfortunately, there is no data available in this upload, so the chart cannot provide any meaningful insights.";
    }

    // Save summary
    chart.aiSummary = summary;
    await upload.save();

    res.json({ summary });
  } catch (err) {
    console.error("Manual Summary Error:", err.message);
    res.status(500).json({
      error: "Failed to generate manual summary",
      details: err.message,
    });
  }
};

export const getAllUploads = async (req, res) => {
  try {
    let query = { user: req.user._id };

    if (req.user.role === "admin") {
      query = {}; 
    }

    const uploads = await Upload.find(query)
      .sort({ createdAt: -1 })
      .populate("user", "username email role");

    return res.status(200).json({
      success: true,
      uploads
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch uploads",
      error: err.message,
      success: false
    });
  }
};


export const deleteUpload = async (req, res) => {
  try {
    const uploadId = req.params.id;

    // Find the upload only if it belongs to the logged-in user
    const deletedUpload = await Upload.findOneAndDelete({
      _id: uploadId,
      user: req.user._id
    });

    if (!deletedUpload) {
      return res.status(404).json({
        message: "Upload not found or not authorized",
        success: false
      });
    }

    const uploads = await Upload.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Upload deleted successfully",
      success: true,
      uploads
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete upload",
      error: err.message,
      success: false
    });
  }
};


export const deleteChart = async (req, res) => {
  try {
    const { uploadId, chartId } = req.params;
     const userId = req.user._id;
     const upload = await Upload.findOne({ _id: uploadId, user: userId });
    if (!upload) {
      return res.status(404).json({ message: 'WTF', success: false });
    }

    const initialLength = upload.charts.length;
    upload.charts = upload.charts.filter(chart => chart._id.toString() !== chartId);

    if (upload.charts.length === initialLength) {
      return res.status(404).json({ message: 'Chart not found', success: false });
    }

    await upload.save();

    res.status(200).json({
      message: 'Chart deleted successfully',
      success: true,
      updatedCharts: upload.charts
    });
  } catch (error) {
    console.error('Error deleting chart:', error);
    res.status(500).json({ message: 'Server error', success: false });
  }
};