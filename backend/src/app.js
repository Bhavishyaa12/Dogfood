const express = require("express");
const app = express();

const cors = require("cors");
const cookieparser = require("cookie-parser");

app.use(express.json());
app.use(cookieparser());

app.use((req, res, next) => {
  res.set("X-API-Version", "1.0");
  next();
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = ["http://localhost:5173", "http://localhost:8080"];

      if (!origin || allowed.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("CORS blocked"));
    },
    credentials: true,
  }),
);

module.exports = app;
