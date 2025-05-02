// import db from "../db/database.js";
import { getEmployeeRepo } from "../repositories/EmployeeRepo.js";
import { getLeaveReqRepo } from "../repositories/LeaveRequestRepo.js";

export const findEmpById = async (emp_id) => {
  try {
    const getEmp = getEmployeeRepo.findOneBy({ emp_id });
    return getEmp;
  } catch (error) {
    console.log("error in employee repo");
    throw new Error("emp fetch failed");
  }
};

export const insertLeaveRequest = async (
  emp_id,
  leave_type,
  from_date,
  to_date,
  reason,
  leaveStatus,
  assignedManagerId,
  totalDays
) => {
  try {
    // console.log("Checking for duplicate leave:", from_date, to_date);
    console.log("leave status", leaveStatus);

    const checkDuplicate = await getLeaveReqRepo.findOneBy({
      from_date,
      to_date,
    });

    if (
      checkDuplicate &&
      from_date === checkDuplicate.from_date &&
      to_date === checkDuplicate.to_date
    ) {
      return {
        duplicate: true,
        message: `Leave already exists for the selected date range (${from_date} to ${to_date}).`,
      };
    }

    const leave = getLeaveReqRepo.create({
      emp_id,
      leave_type,
      from_date,
      to_date,
      reason,
      status: leaveStatus,
      num_of_days: totalDays,
      manager_id: assignedManagerId,
    });

    await getLeaveReqRepo.save(leave);
    return { duplicate: false, message: "Leave inserted with repo" };
  } catch (error) {
    console.error("Insert Leave Error:", error);
    return { message: "Leave insert failed", error };
  }
};

export const updateLeaveBalance = async (emp_id, leave_type, totalDays) => {
  try {
    const employee = await findEmpById(emp_id);

    if (!employee) {
      throw new Error("Employee not found");
    }

    // Decrease the specific leave type and total balance

    employee[leave_type] = employee[leave_type] - totalDays;
    employee.total_leave_balance = employee.total_leave_balance - totalDays;

    await getEmployeeRepo.save(employee);

    // Return updated leave values
    return {
      [leave_type]: employee[leave_type],
      total_leave_balance: employee.total_leave_balance,
    };
  } catch (error) {
    console.error("Error in updateLeaveBalance:", error);
    throw new Error("Failed to update leave balance");
  }
};

export const getLeaveRequests = async (manager_id) => {
  const leaveRequests = await getLeaveReqRepo.find({
    where: {
      manager_id,
      status: "PENDING",
    },
    relations: {
      employee: true,
    },
    order: {
      created_at: "DESC",
    },
  });

  // If you want to return emp_name instead of the full employee object:
  return leaveRequests.map((lr) => ({
    leave_req_id: lr.leave_req_id,
    emp_id: lr.emp_id,
    emp_name: lr.employee.emp_name,
    leave_type: lr.leave_type,
    from_date: lr.from_date,
    to_date: lr.to_date,
    reason: lr.reason,
    status: lr.status,
    num_of_days: lr.num_of_days,
    created_at: lr.created_at,
  }));
};

export const leaveReqApproval = async (
  leave_req_id,
  newStatus,
  rejection_reason
) => {
  const leaveReq = await getLeaveReqRepo.findOneBy({ leave_req_id });
  if (!leaveReq) {
    throw new Error("Leave request not found");
  }
  leaveReq.status = newStatus;
  leaveReq.rejection_reason =
    newStatus === "REJECTED" ? rejection_reason : null;

  return await getLeaveReqRepo.save(leaveReq);
};

export const cancelLeaveHelper = async (leave_req_id, emp_id) => {
  const leave = await getLeaveReqRepo.findOneBy({ leave_req_id });

  if (!leave) {
    throw { code: 404, message: "Leave request not found" };
  }

  if (leave.emp_id !== parseInt(emp_id)) {
    throw {
      code: 403,
      message: "You are not authorized to cancel this leave",
    };
  }

  if (leave.status === "PENDING" || leave.status === "APPROVED") {
    leave.status = "CANCELLED";
    await getLeaveReqRepo.save(leave);
    return "Leave cancelled successfully";
  } else {
    throw {
      code: 400,
      message: "Only PENDING or APPROVED leaves can be cancelled",
    };
  }
};

export const leaveBalanceHelper = async (emp_id) => {
  // console.log(emp_id);
  try {
    const employee = await findEmpById(emp_id);
    if (!employee) {
      return { code: 500, message: "Employee not found" };
    }
    return employee.total_leave_balance;
  } catch (error) {
    throw {
      code: 400,
      message: error,
    };
  }
};

export const insertEmpHelper = async (
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
  try {
    const employee = getEmployeeRepo.create({
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
    });
    const insertEmp = await getEmployeeRepo.save(employee);
    return { message: "Inserted success" };
  } catch (error) {
    console.error("Error inserting employee:", error);
    throw new Error("Insert failed");
  }
  // return new Promise((resolve, reject) => {
  //   const insertOne =
  //     "INSERT into employees (emp_name,department,role,manager_id,manager_name,sr_manager_id,sr_manager_name,total_leave_balance,sick_leave,floater_leave,earned_leave,loss_of_pay) values (?,?,?,?,?,?,?,?,?,?,?,?)";
  //   db.query(
  //     insertOne,
  //     [
  //       emp_name,
  //       department,
  //       role,
  //       manager_id,
  //       manager_name,
  //       sr_manager_id,
  //       sr_manager_name,
  //       total_leave_balance,
  //       sick_leave,
  //       floater_leave,
  //       earned_leave,
  //       loss_of_pay,
  //     ],
  //     (err) => {
  //       if (err)
  //         return reject({
  //           message: "Error inserting employee request",
  //           code: 500,
  //         });
  //       resolve();
  //     }
  //   );
  // });
};

// export const bulkInsertEmpHelper = (employees) => {
//   return new Promise((resolve, reject) => {
//     const bulkInsert = `INSERT INTO employees (emp_name,department,role,manager_id,manager_name,sr_manager_id,sr_manager_name,total_leave_balance,sick_leave,floater_leave,earned_leave,loss_of_pay) values ?`;

//     db.query(bulkInsert, [employees], (err) => {
//       if (err) {
//         reject(console.log("failed to bulk insert,", err));
//       }
//       resolve();
//     });
//   });
// };
