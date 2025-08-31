import dotenv from 'dotenv';
dotenv.config();
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import helmet from 'helmet'
import connectDB  from './utils/connectDB.js'
import './utils/cloudinary.js';
import userRoute from './routes/user.route.js';
import uploadRoute from './routes/upload.route.js';
import createSuperAdmin from './controllers/superAdminController.js';
import superAdminRoute from './routes/superadmin.route.js';

const app=express();
connectDB().then(() => {
  createSuperAdmin();
});

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:true}))
app.use(cors({
  origin:  [process.env.CLIENT_URL, "http://localhost:5173"],
  credentials: true,              
}));

app.use('/api/excel/user',userRoute);
app.use('/api/excel/upload',uploadRoute);
app.use('/api/excel/superadmin', superAdminRoute);

const PORT=process.env.PORT||8000;
app.listen(PORT,()=>{
    console.log(` your application is running at the http://localhost:${PORT}`);
})