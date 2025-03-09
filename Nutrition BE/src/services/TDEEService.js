// services/TDEEService.js
const diarymodel = require('../models/diary.model');
const goalmodel = require('../models/goal.model');
const usermodel = require('../models/user.model');
// Hàm tính TDEE dựa trên các thông tin của người dùng
const calculateTDEE = (user) => {
    const { weight, height, birthday, gender, activity_level } = user;
    const age = new Date().getFullYear() - new Date(birthday).getFullYear();

    let BMR;
    if (gender === 'male') {
        BMR = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        BMR = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Hệ số hoạt động
    let activityFactor;
    switch (activity_level) {
        case 'not very active': activityFactor = 1.375; break;
        case 'moderately active': activityFactor = 1.55; break;
        case 'active': activityFactor = 1.725; break;
        case 'very active': activityFactor = 1.9; break;
        //default: activityFactor = 1.2;
    }

    // TDEE = BMR * activityFactor
    const TDEE = BMR * activityFactor;
    return TDEE;
};

// Hàm điều chỉnh TDEE dựa trên mục tiêu
const adjustTDEEForGoal = (TDEE, goal) => {
    if (goal.goal_type === 'weight loss') {
        return parseFloat((TDEE - 500).toFixed(2));
    } else if (goal.goal_type === 'weight gain') {
        return parseFloat((TDEE + 500).toFixed(2));
    }
    return parseFloat(TDEE.toFixed(2));
};

// Hàm tính toán macros (protein, carbs, fat)
const calculateMacros = (calories) => {
    const protein = (calories * 0.30) / 4;
    const carbs = (calories * 0.40) / 4;
    const fat = (calories * 0.30) / 9;

    return {
        protein: parseFloat(protein.toFixed(2)),
        carbs: parseFloat(carbs.toFixed(2)),
        fat: parseFloat(fat.toFixed(2)),
    };
};


// Hàm tính số ngày để đạt được mục tiêu cân nặng
const daytoGoal = (user, goal) => {
    const day = (Math.abs(user.weight - goal.weight_goal) / 0.5) * 7;
    // Lấy ngày hiện tại
    const currentDate = new Date();

    // Cộng số ngày để đạt được mục tiêu
    currentDate.setDate(currentDate.getDate() + day);

    // Trả về ngày đạt được mục tiêu
    return currentDate;
};


// Hàm tổng hợp xử lý logic và lưu kết quả vào nhật ký (diary)
const updateUserTDEEAndDiary = async (userId, diaryId, user, goal, goalId) => {

    if (!user || !goal) throw new Error('Không tìm thấy user hoặc goal');

    // Tính toán TDEE và điều chỉnh theo mục tiêu
    const TDEE = calculateTDEE(user);
    const adjustedTDEE = adjustTDEEForGoal(TDEE, goal);
    // Tính toán macro dinh dưỡng dựa trên TDEE điều chỉnh
    const macros = calculateMacros(adjustedTDEE);
    await usermodel.updateCaloriesDaily(userId, adjustedTDEE);
    const daytogoal = daytoGoal(user, goal);
    await goalmodel.updatedaytoGoal(goalId, daytogoal);
    // Gọi model để lưu kết quả vào bảng Diary
    await diarymodel.saveDiaryEntry(diaryId, adjustedTDEE, macros);
};

module.exports = {
    calculateTDEE,
    adjustTDEEForGoal,
    calculateMacros,
    updateUserTDEEAndDiary,
    daytoGoal
};
