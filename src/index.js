const express = require("express");
const app = express();
const initRoutes = require("./routes/index");
require("./config/connectionDB");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
initRoutes(app);
const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server started on port ${PORT}`));