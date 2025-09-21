const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const app_server = require("./app-routes.js");
const ContactModel = require("./model/contact-model.js");
const companymodel = require("./model/company-model.js");
const leadmodel = require("./model/lead-model.js"); //opportunitymodel
const opportunitymodel = require("./model/opportunity-model.js"); //
const usermodel = require("./model/user-model.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URL =
  "mongodb+srv://user2000:Mahiram%409797@cluster0.zdfnqjl.mongodb.net/mycrm?retryWrites=true&w=majority&appName=mycrm";

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("tiny"));
app.disable("x-powered-by");

// Route setup

app.use("/api", app_server);
app.get("/", (req, res) => {
  res.send("Hello! Server is accessible.");
});
// Connect to MongoDB using Mongoose
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.setHeader("Content-Type", "application/json");
  res.status(500).json({
    message: "Something went wrong",
    error: err.message || "Internal Server Error",
  });
});
mongoose.set("strictQuery", false);
// mongoose
//   .connect(MONGODB_URL)
//   .then(() => {
//     console.log("✅ MongoDB Connected");
//     // Start server only after successful DB connection
//     app.listen(PORT, () => {
//       console.log(`🚀 Server running at http://localhost:${PORT}`);
//     });

//     // Optional root route
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB connection error:", err);
//     process.exit(1);
//   });

mongoose
  .connect(MONGODB_URL)
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // 🔹 Sync indexes for all models (important for compound indexes)
    await ContactModel.syncIndexes();
    await companymodel.syncIndexes();
    await leadmodel.syncIndexes();
    await opportunitymodel.syncIndexes();
    await usermodel.syncIndexes();

    console.log("✅ All indexes synced");

    // Start server only after successful DB connection + indexes
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
