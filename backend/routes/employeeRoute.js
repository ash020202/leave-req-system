import express from "express";
import {
  bulkInsertEmployees,
  getAllEmployees,
  insertEmployees,
} from "../controllers/employeeController.js";

const router = express.Router();

router.get("/", getAllEmployees);
router.post("/insert-one", insertEmployees);
router.post("/insert-many", bulkInsertEmployees);

export default router;
