import db from "../db/database.js";
// Function to update leave balance after approval
export const updateLeaveBalance = (emp_id, leave_type, totalDays) => {
  const updateQuery = `
      UPDATE employees
      SET ${leave_type} = ${leave_type} - ?, total_leave_balance = total_leave_balance - ?
      WHERE emp_id = ?
    `;
  const selectQuery = `
      SELECT ${leave_type}, total_leave_balance FROM employees WHERE emp_id = ?
    `;

  return new Promise((resolve, reject) => {
    db.query(
      updateQuery,
      [totalDays, totalDays, emp_id],
      (err, updateResult) => {
        if (err) {
          console.log(err);
          return reject({ message: "Error updating leave balance", code: 500 });
        }

        db.query(selectQuery, [emp_id], (err, result) => {
          if (err) {
            return reject({
              message: "Error fetching updated leave balance",
              code: 500,
            });
          }
          resolve(result[0]); // Contains updated leave_type and total_leave_balance
        });
      }
    );
  });
};

// Function to insert leave request into database
export const insertLeaveRequest = (
  emp_id,
  leave_type,
  from_date,
  to_date,
  reason,
  status,
  manager_id,
  totalDays
) => {
  return new Promise((resolve, reject) => {
    const checkDuplicateLeave = `
        SELECT * FROM leave_requests 
        WHERE emp_id = ? AND from_date = ? AND to_date = ?
      `;

    db.query(
      checkDuplicateLeave,
      [emp_id, from_date, to_date],
      (err, result) => {
        if (err)
          return reject({
            message: "Error checking for duplicate leave",
            code: 500,
          });

        if (result.length > 0) {
          return reject({
            message: "Leave request already exists for these dates",
            code: 200,
          });
        }

        const insertQuery = `
          INSERT INTO leave_requests 
          (emp_id, leave_type, from_date, to_date, reason, status, cancelled, num_of_days, created_at, manager_id)
          VALUES (?, ?, ?, ?, ?, ?, 0, ?, NOW(), ?)
        `;

        db.query(
          insertQuery,
          [
            emp_id,
            leave_type,
            from_date,
            to_date,
            reason,
            status,
            totalDays,
            manager_id,
          ],
          (err) => {
            if (err)
              return reject({
                message: "Error inserting leave request",
                code: 500,
              });
            resolve(); // All good!
          }
        );
      }
    );
  });
};

// Function to get employee details from the database
export const getEmployeeDetails = (emp_id) => {
  return new Promise((resolve, reject) => {
    const getEmployeeQuery = `SELECT * FROM employees WHERE emp_id = ?`;
    db.query(getEmployeeQuery, [emp_id], (err, results) => {
      if (err) reject("Error fetching employee details");
      resolve(results[0]);
    });
  });
};

export const getLeaveRequests = (manager_id) => {
  const query = `
SELECT 
    lr.leave_req_id,
    lr.emp_id,
    e.emp_name,
    lr.leave_type,
    lr.from_date,
    lr.to_date,
    lr.reason,
    lr.status,
    lr.num_of_days,
    lr.created_at
FROM 
    leave_requests lr
JOIN 
    employees e ON lr.emp_id = e.emp_id
WHERE 
    lr.manager_id = ? and status = 'PENDING'
ORDER BY 
    lr.created_at DESC
`;
  return new Promise((resolve, reject) => {
    db.query(query, [manager_id], (err, results) => {
      if (err) {
        console.log(err);
        return reject("Error fetching leave requests");
      }
      resolve(results);
    });
  });
};

export const leaveReqApproval = (leave_req_id, newStatus, rejection_reason) => {
  return new Promise((resolve, reject) => {
    let query = `UPDATE leave_requests SET status = ? WHERE leave_req_id = ?`;
    let params = [newStatus, leave_req_id];

    // If the status is 'REJECTED', include the rejection reason
    if (newStatus === "REJECTED" && rejection_reason) {
      query = `UPDATE leave_requests SET status = ?, rejection_reason = ? WHERE leave_req_id = ?`;
      params = [newStatus, rejection_reason, leave_req_id];
    }

    db.query(query, params, (err, result) => {
      if (err) {
        console.log(err);
        reject({ message: "Error updating leave request status", code: 500 });
      }
      resolve(result);
    });
  });
};

export const cancelLeaveHelper = (leave_req_id, emp_id) => {
  return new Promise((resolve, reject) => {
    console.log(leave_req_id);

    const selectQuery = `SELECT * FROM leave_requests WHERE leave_req_id = ?`;

    db.query(selectQuery, [leave_req_id], (err, results) => {
      if (err) {
        return reject({ code: 500, message: "Error fetching leave request" });
      }

      const leave = results[0];

      if (!leave) {
        return reject({ code: 404, message: "Leave request not found" });
      }

      if (leave.emp_id != emp_id) {
        return reject({
          code: 403,
          message: "You are not authorized to cancel this leave",
        });
      }

      if (leave.status === "PENDING" || leave.status === "APPROVED") {
        const updateQuery = `UPDATE leave_requests SET status = 'CANCELLED' WHERE leave_req_id = ?`;
        db.query(updateQuery, [leave_req_id], (updateErr) => {
          if (updateErr) {
            return reject({ code: 500, message: "Error cancelling leave" });
          }
          return resolve("Leave cancelled successfully");
        });
      } else {
        return reject({
          code: 400,
          message: "Only PENDING or APPROVED leaves can be cancelled",
        });
      }
    });
  });
};

export const insertEmpHelper = (
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
) => {
  return new Promise((resolve, reject) => {
    const insertOne =
      "INSERT into employees (emp_name,department,role,manager_id,manager_name,sr_manager_id,sr_manager_name,total_leave_balance,sick_leave,floater_leave,earned_leave,loss_of_pay) values (?,?,?,?,?,?,?,?,?,?,?,?)";
    db.query(
      insertOne,
      [
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
      ],
      (err) => {
        if (err)
          return reject({
            message: "Error inserting employee request",
            code: 500,
          });
        resolve();
      }
    );
  });
};

export const bulkInsertEmpHelper = (employees) => {
  return new Promise((resolve, reject) => {
    const bulkInsert = `INSERT INTO employees (emp_name,department,role,manager_id,manager_name,sr_manager_id,sr_manager_name,total_leave_balance,sick_leave,floater_leave,earned_leave,loss_of_pay) values ?`;

    db.query(bulkInsert, [employees], (err) => {
      if (err) {
        reject(console.log("failed to bulk insert,", err));
      }
      resolve();
    });
  });
};
