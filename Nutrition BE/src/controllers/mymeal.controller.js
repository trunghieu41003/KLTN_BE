// src/controllers/mealController.js
const diarymodel = require('../models/diary.model');
const usermodel = require('../models/user.model');
const foodmodel = require('../models/food.model');
const listfoodmodel = require('../models/listfood.model');
const TDEEService = require('../services/TDEEService');
const goalmodel = require('../models/goal.model');


//Thêm 1 món ăn vào meal
const addFoodToMeal = async (req, res) => {
  const { mealId } = req.params;
  const { userId, date, foodId, portion, calories, carbs, fat, protein, ingredients_list } = req.body;

  try {
    const diary = await diarymodel.getDiary(date, userId);
    const diaryId = diary.diary_id;
    console.log({ foodId, mealId, diaryId, portion, calories, carbs, fat, protein });
    const ListFood = await listfoodmodel.findListFood(diaryId, mealId);
    const ListFoodId = ListFood.ListFood_ID;
    console.log({ diaryId, ListFoodId });
    await listfoodmodel.insertFoodInList(foodId, ListFoodId, portion, calories, carbs, fat, protein);
    await listfoodmodel.updateFoodNutrition(ListFoodId, foodId);
    await listfoodmodel.updateListFoodNutrition(ListFoodId);
    await diarymodel.updateNutritionConsumed(diaryId);
    await diarymodel.decreaseNutritionRemain(ListFoodId, foodId, diaryId);
    const food = await listfoodmodel.getAllFoodByDate(diaryId);

    return res.status(200).json({
      message: 'Add successfully',
      food: food, ingredients_list: ingredients_list
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


// Xóa 1 món ăn khỏi meal
const removeFoodFromMeal = async (req, res) => {
  const { mealId, foodId } = req.params;
  const { userId, date } = req.body;
  try {
    const diary = await diarymodel.getDiary(date, userId);
    const diaryId = diary.diary_id;
    const ListFood = await listfoodmodel.findListFood(diaryId, mealId);
    const ListFoodId = ListFood.ListFood_ID;
    await diarymodel.increaseNutritionRemain(ListFoodId, foodId, diaryId);
    await listfoodmodel.removeFoodFromList(foodId, ListFoodId);
    await listfoodmodel.updateListFoodNutrition(ListFoodId);
    await diarymodel.updateNutritionConsumed(diaryId);
    const food = await listfoodmodel.getFoodByID(foodId, ListFoodId);
    return res.status(200).json({ message: 'Remove successfully', food });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Update size hay portion của món ăn
const updatePortionSize = async (req, res) => {
  const { mealId, foodId } = req.params;
  const { userId, date, portion } = req.body;

  try {
    const diary = await diarymodel.getDiary(date, userId);
    const diaryId = diary.diary_id;
    const ListFood = await listfoodmodel.findListFood(diaryId, mealId);
    const ListFoodId = ListFood.ListFood_ID;
    const food = await listfoodmodel.getFoodByID(foodId, ListFoodId);
    const calories_before = food.calories;
    console.log(calories_before);
    await diarymodel.increaseNutritionRemain(ListFoodId, foodId, diaryId);
    await listfoodmodel.UpdatePortionSize(portion, foodId, ListFoodId);
    await listfoodmodel.updateFoodNutrition(ListFoodId, foodId);
    await listfoodmodel.updateListFoodNutrition(ListFoodId);
    await diarymodel.updateNutritionConsumed(diaryId);
    const foodtemp = await listfoodmodel.getFoodByID(foodId, ListFoodId);
    const calories_after = foodtemp.calories;
    console.log(calories_after);
    await diarymodel.decreaseNutritionRemain(ListFoodId, foodId, diaryId);
    const foodNutrition = await listfoodmodel.getFoodByID(foodId, ListFoodId);
    return res.status(200).json({ message: 'Update successfully', foodNutrition });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Lấy ra dinh dưỡng meal theo Date
const getNutritionByDate = async (req, res) => {
  const { userId, date } = req.query;
  try {
    const diary = await diarymodel.getDiary(date, userId);
    const diaryId = diary.diary_id;
    const food = await listfoodmodel.getAllFoodByDate(diaryId);
    return res.status(200).json({ food });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//Lấy ra dinh dưỡng food 
const getfoodInformation = async (req, res) => {
  const { mealId, foodId } = req.params;
  const { userId, date } = req.query;
  try {
    const diary = await diarymodel.getDiary(date, userId);
    const diaryId = diary.diary_id;
    if (!diaryId) console.log('nodiary');
    console.log(diaryId);
    const ListFood = await listfoodmodel.findListFood(diaryId, mealId);
    const ListFoodId = ListFood.ListFood_ID;
    const food = await listfoodmodel.getFoodByID(foodId, ListFoodId);
    return res.status(200).json({ food });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const addNewDiary = async (req, res) => {
  const { date, userId } = req.body;
  try {
    // Kiểm tra xem nhật ký đã tồn tại hay chưa
    const existingDiary = await diarymodel.getDiary(date, userId);
    if (existingDiary) {
      return res.status(400).json({
        message: 'This user already has a diary for this date',
        diary: existingDiary,
      });
    }

    console.log({ date });

    // Tạo một nhật ký mới
    const newdiary = await diarymodel.newDiary(date, userId);

    // Liên kết danh sách thực phẩm với từng bữa ăn
    const ListFood1 = await listfoodmodel.LinkMealListFood(1);
    const ListFood2 = await listfoodmodel.LinkMealListFood(2);
    const ListFood3 = await listfoodmodel.LinkMealListFood(3);

    console.log(ListFood1.ListFoodId, ListFood2.ListFoodId, ListFood3.ListFoodId, newdiary.diaryId);

    // Thêm danh sách thực phẩm vào nhật ký
    await diarymodel.addListFoodtoDiary(newdiary.diaryId, ListFood1.ListFoodId);
    await diarymodel.addListFoodtoDiary(newdiary.diaryId, ListFood2.ListFoodId);
    await diarymodel.addListFoodtoDiary(newdiary.diaryId, ListFood3.ListFoodId);

    // Cập nhật thông tin người dùng và mục tiêu
    const user = await usermodel.findUserByID(userId);
    const goal = await goalmodel.findGoalbyUser(userId);
    const goalId = goal.goal_id;

    await TDEEService.updateUserTDEEAndDiary(userId, newdiary.diaryId, user, goal, goalId);

    // Lấy lại nhật ký vừa thêm
    const diary = await diarymodel.getDiary(date, userId);

    return res.status(200).json({ message: 'Diary added successfully', diary });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


const getAllFood = async (req, res) => {
  const { foodId } = req.params;
  try {
    const food = await foodmodel.getAllFood(foodId);
    return res.status(200).json({ food });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
module.exports = {
  addFoodToMeal,
  removeFoodFromMeal,
  updatePortionSize,
  getNutritionByDate,
  getfoodInformation,
  addNewDiary,

  getAllFood
};
