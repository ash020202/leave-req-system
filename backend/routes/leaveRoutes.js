import express from "express";
import {
  cancelLeave,
  changeLeaveStatus,
  getManagerLeaveRequests,
  submitLeave,
} from "../controllers/leaveController.js";

const router = express.Router();

router.post("/request", submitLeave);
router.get("/manager/leaves/:manager_id", getManagerLeaveRequests);
router.post("/status/:leave_req_id", changeLeaveStatus);
router.post("/cancel/:leave_req_id", cancelLeave);

export default router;
