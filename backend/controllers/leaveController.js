import {
  cancelLeaveHelper,
  getEmployeeDetails,
  getLeaveRequests,
  insertLeaveRequest,
  leaveReqApproval,
  updateLeaveBalance,
} from "../utils/Helper.js";

export const submitLeave = async (req, res) => {
  const { emp_id, leave_type, from_date, to_date, reason } = req.body;

  try {
    const employee = await getEmployeeDetails(emp_id);

    const leaveCount = employee[leave_type];

    const totalDays =
      Math.ceil(
        (new Date(to_date) - new Date(from_date)) / (1000 * 60 * 60 * 24)
      ) + 1;

    let assignedManagerId, assignedManagerName, leaveStatus;

    if (leaveCount >= totalDays) {
      // Sufficient leave
      assignedManagerId = employee.manager_id;
      assignedManagerName = employee.manager_name;
      leaveStatus = leave_type === "sick_leave" ? "APPROVED" : "PENDING";
    } else {
      // Insufficient leave
      assignedManagerId = employee.sr_manager_id;
      assignedManagerName = employee.sr_manager_name;
      leaveStatus = "PENDING";
    }

    try {
      await insertLeaveRequest(
        emp_id,
        leave_type,
        from_date,
        to_date,
        reason,
        leaveStatus,
        assignedManagerId,
        totalDays
      );
      let remainingLeave = 0;
      if (leaveCount >= totalDays) {
        const updateleave = await updateLeaveBalance(
          emp_id,
          leave_type,
          totalDays
        );
        remainingLeave = updateleave;
      }
      const resMsg =
        leave_type == "sick_leave"
          ? "leave request approved"
          : `leave request sent to ${assignedManagerName}`;

      const message =
        leaveCount >= totalDays
          ? leave_type === "sick_leave"
            ? `${leave_type} leave approved and ${totalDays} days deducted from balance.`
            : `${leave_type} leave request sent to ${assignedManagerName} and ${totalDays} days deducted from balance.`
          : `${leave_type} leave balance insufficient. Leave request forwarded to Senior Manager ${assignedManagerName}`;

      return res.status(200).send({ message, remainingLeave });
    } catch (insertErr) {
      return res
        .status(insertErr.code || 500)
        .send({ error: insertErr.message });
    }
  } catch (err) {
    console.error("Error processing leave request:", err);
    return res.status(500).send({ error: "Unexpected server error" });
  }
};

export const getManagerLeaveRequests = async (req, res) => {
  const { manager_id } = req.params;

  try {
    const leaveRequests = await getLeaveRequests(manager_id);
    if (leaveRequests.length == 0) {
      return res.status(200).json({ message: "No Pending Leave Request" });
    }
    return res.json(leaveRequests);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error fetching leave requests");
  }
};

export const changeLeaveStatus = async (req, res) => {
  const { leave_req_id } = req.params;
  const { newStatus, approver_id, rejection_reason } = req.body;

  try {
    const employee = await getEmployeeDetails(approver_id);
    const approver_name = employee.emp_name;
    // console.log(approver_name);

    if (!employee) {
      return res.status(404).json({ message: "Approver not found" });
    }

    // Check if the employee is a Manager or Senior Manager
    if (employee.role === "MANAGER" || employee.role === "SENIOR_MANAGER") {
      // If the new status is 'REJECTED', we need to ensure rejection_reason is provided
      if (newStatus === "REJECTED" && !rejection_reason) {
        return res
          .status(400)
          .json({ message: "Rejection reason is required" });
      }

      // Call your function to update the leave request status in the database
      try {
        await leaveReqApproval(leave_req_id, newStatus, rejection_reason);

        return res.status(200).json({
          message: `Leave status updated to ${newStatus} successfully by ${approver_name}`,
        });
      } catch (error) {
        return res
          .status(500)
          .json({ message: `Error in Leave Request Approval` });
      }
    }

    // If the user is not a manager or senior manager, return a 403 Forbidden error
    return res.status(403).json({
      message: "Only managers or senior managers can approve or reject leaves.",
    });
  } catch (error) {
    console.log("Error in controller:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request." });
  }
};

export const cancelLeave = async (req, res) => {
  const { leave_req_id } = req.params;
  const { emp_id } = req.body; // Make sure emp_id is sent from frontend

  try {
    const result = await cancelLeaveHelper(leave_req_id, emp_id);
    return res.status(200).json({ message: result });
  } catch (error) {
    console.error("Cancel Error:", error);
    return res.status(error.code || 500).json({ message: error.message });
  }
};
