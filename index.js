// Import
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const isAuthenticated = require("./middlewares/isAuthenticated");
const cors = require("cors");
require("dotenv").config;

//Initialize
const app = express();
app.use(cors());
app.use(formidable());
app.use(isAuthenticated);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Routes
const userRoutes = require("./routes/user");
app.use(userRoutes);
const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ error: { message: "Page not found" } });
});

//Start server
app.listen(process.env.PORT, () => {
  console.log(`Server started on port : ${process.env.PORT}`);
});
