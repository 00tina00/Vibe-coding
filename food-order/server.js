const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const menu = [
  { code: "PIZZA", name: "Pepperoni Pizza" },
  { code: "PASTA", name: "Spaghetti Carbonara" },
  { code: "SALAD", name: "Caesar Salad" },
];

const orders = [];

app.get("/api/menu", (req, res) => {
  const menuWithCounts = menu.map((item) => ({
    ...item,
    orderCount: orders.filter((order) => order.dishCode === item.code).length,
  }));

  res.json({ menu: menuWithCounts });
});

app.post("/api/order", (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      error: "Request body is required. Send JSON with memberCode and dishCode.",
    });
  }

  const { memberCode, dishCode } = req.body;

  if (!memberCode || !dishCode) {
    return res.status(400).json({ error: "memberCode and dishCode are required" });
  }

  const dishExists = menu.some((item) => item.code === dishCode);
  if (!dishExists) {
    return res.status(400).json({ error: "Invalid dish code" });
  }

  const alreadyOrdered = orders.some((order) => order.memberCode === memberCode);
  if (alreadyOrdered) {
    return res.status(400).json({ error: "Member has already placed an order" });
  }

  orders.push({ memberCode, dishCode });

  res.status(201).json({
    message: "Order placed successfully",
    memberCode,
    dishCode,
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
