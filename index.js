const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
res.send("BattlePie AFK Dashboard is running!");
});

app.get("/status", (req, res) => {
res.json({
status: "Not connected",
message: "Minecraft connection is not configured yet."
});
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
console.log("Dashboard running on port ${PORT}");
});
