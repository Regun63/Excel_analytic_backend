import express from "express";
import { 
  getPendingRequests,
  approveRequest,
  rejectRequest
} from "../controllers/superAdminController.js";

const router = express.Router();

// GET all pending admin approval requests
router.get("/requests", getPendingRequests);

// POST approve request
router.post("/approve/:id", approveRequest);

// POST reject request
router.post("/reject/:id", rejectRequest);

export default router;
