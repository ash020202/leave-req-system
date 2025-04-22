import mysql2 from "mysql2";

const db = mysql2.createConnection({
  host: "localhost",
  user: "root",
  password: "Vimal@2030",
  database: "leave_request_sys_db",
});

db.connect((err) => {
  if (err) {
    console.log("Db conn error", err);
    return;
  }

  console.log("db connect success");
});

export default db;
