require("dotenv").config();
const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");
const { connectDB } = require("./config/db");
const router = require("./Routes/index");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyparser.json({ limit: "50mb" }));
app.use(bodyparser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("hello this is internshala backend");
});

app.use("/api", router);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log("✓ Server Running");
    });
  } catch (error) {
    console.error("Failed to start server due to database connection error");
    process.exit(1);
  }
};

startServer();
