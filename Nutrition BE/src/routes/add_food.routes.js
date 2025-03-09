const express = require("express");
const router = express.Router();
const add_food_Controller = require("../controllers/add_food.controller");

// Route gọi API tạo lịch ăn
router.post("/add_food", add_food_Controller.addFoodToMeal);

module.exports = router;