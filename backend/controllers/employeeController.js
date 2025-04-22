import db from "../db/database.js";
import { bulkInsertEmpHelper, insertEmpHelper } from "../utils/Helper.js";

export const getAllEmployees = (req, res) => {
  const selectAllEmployee = "SELECT * FROM employees";
  db.query(selectAllEmployee, (err, results) => {
    if (err) {
      console.log("Error Fetching emp", err);
    }
    return res.json(results);
  });
};

export const insertEmployees = async (req, res) => {
  const {
    emp_name,
    department,
    role,
    manager_id,
    manager_name,
    sr_manager_id,
    sr_manager_name,
    total_leave_balance,
    sick_leave,
    floater_leave,
    earned_leave,
    loss_of_pay,
  } = req.body;
  try {
    await insertEmpHelper(
      emp_name,
      department,
      role,
      manager_id,
      manager_name,
      sr_manager_id,
      sr_manager_name,
      total_leave_balance,
      sick_leave,
      floater_leave,
      earned_leave,
      loss_of_pay
    );
    return res.status(200).json({ message: "success inserted" });
  } catch (error) {
    return res.json({ message: "error in insert helper" });
  }
};

export const bulkInsertEmployees = async (req, res) => {
  const { employees } = req.body;
  try {
    await bulkInsertEmpHelper(employees);
    return res.status(200).json({ message: "success bulk inserted" });
  } catch (error) {
    return res.json({ message: "error in bulk insert helper" });
  }
};
