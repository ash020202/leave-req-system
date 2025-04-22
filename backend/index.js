import express from "express";
import cors from "cors";
//initial call to create db and tables
import "./db/database.js";
import bodyParser from "body-parser";
import empRoute from "./routes/employeeRoute.js";
import leaveRoute from "./routes/leaveRoutes.js";
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

app.use("/api/employees", empRoute);
app.use("/api/leave", leaveRoute);

const port = 5000;

app.listen(port, () => {
  console.log("running", port);
});
