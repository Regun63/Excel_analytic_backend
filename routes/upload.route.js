import express from "express";
import upload from "../middleware/multer.js";
import {authMiddleware } from '../middleware/authMiddleware.js'
import {
 uploadExcelFile,
 addChartToUpload,
 generateAISummary,
 deleteUpload,
 deleteChart,
 getAllUploads
} from '../controllers/uploadController.js'
const router=express.Router();
router.post('/uploadFile',authMiddleware,upload.single("file"),uploadExcelFile)
router.post('/addchart/:id',authMiddleware,addChartToUpload)
router.get('/getAllUploads',authMiddleware,getAllUploads)
router.post('/summary/:uploadId/:chartId',authMiddleware,generateAISummary)
router.delete('/deleteupload/:id',authMiddleware,deleteUpload)
router.delete('/:uploadId/deletechart/:chartId',authMiddleware,deleteChart)
export default router;