const express = require("express");
const router = express.Router();
const mealController = require("../controllers/generate.controller");

// Route gọi API tạo lịch ăn
router.post("/generate-meal-plan", mealController.generateMealPlan);

module.exports = router;
