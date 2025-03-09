const connection = require('../config/database');

const getCaloriesGoal = (userId) => {
  return new Promise((resolve, reject) => {
    const getQuery = 'SELECT calories_remaining FROM diary WHERE user_id = ?';
    connection.query(getQuery, [userId], (err, results) => {
      if (err) reject(err);
      else if (results.length === 0) resolve(null); // Handle no results
      else resolve(results[0]); // Return the first result
    });
  });
};
const getUserDiary = (userId) => {
  return new Promise((resolve, reject) => {
    // Câu truy vấn SQL với điều kiện ngày >= ngày hiện tại
    const getQuery = 'SELECT diary_id FROM diary WHERE user_id = ? AND date >= CURDATE()';
    // Thực hiện truy vấn
    connection.query(getQuery, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};
const updateNutritionConsumed = (diaryId) => {
  const updateQuery = `
    UPDATE diary 
    SET 
      calories_consumed = (
        SELECT 
          COALESCE(SUM(ListFood_calories), 0)
        FROM diary_listfood dl Join listfood lf on dl.ListFood_ID = lf.ListFood_ID
        WHERE diary_id = ?
      ),
      carbs_consumed = (
        SELECT 
          COALESCE(SUM(ListFood_carbs), 0)
        FROM diary_listfood dl Join listfood lf on dl.ListFood_ID = lf.ListFood_ID
        WHERE diary_id = ?
      ),
      protein_consumed = (
        SELECT 
          COALESCE(SUM(ListFood_protein), 0)
        FROM diary_listfood dl Join listfood lf on dl.ListFood_ID = lf.ListFood_ID
        WHERE diary_id = ?
      ),
      fat_consumed = (
        SELECT 
          COALESCE(SUM(ListFood_fat), 0)
        FROM diary_listfood dl Join listfood lf on dl.ListFood_ID = lf.ListFood_ID
        WHERE diary_id = ?
      )
    WHERE diary_id = ?;
  `;
  return new Promise((resolve, reject) => {
    connection.query(updateQuery, [diaryId, diaryId, diaryId, diaryId, diaryId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};
const decreaseNutritionRemain = (ListFoodId, foodId, diaryId) => {
  const updateQuery = `
    UPDATE diary 
SET 
  calories_remaining = COALESCE(calories_remaining, 0) - COALESCE(
    (SELECT calories FROM listfood_food WHERE ListFood_id = ? AND food_id = ?), 0
  ),
  carbs_remaining = COALESCE(carbs_remaining, 0) - COALESCE(
    (SELECT carbs FROM listfood_food WHERE ListFood_id = ? AND food_id = ?), 0
  ), 
  protein_remaining = COALESCE(protein_remaining, 0) - COALESCE(
    (SELECT protein FROM listfood_food WHERE ListFood_id = ? AND food_id = ?), 0
  ), 
  fat_remaining = COALESCE(fat_remaining, 0) - COALESCE(
    (SELECT fat FROM listfood_food WHERE ListFood_id = ? AND food_id = ?), 0
  )
WHERE diary_id = ?;

  `;
  return new Promise((resolve, reject) => {
    connection.query(updateQuery, [
      ListFoodId, foodId, // calories_remaining
      ListFoodId, foodId, // carbs_remaining
      ListFoodId, foodId, // protein_remaining
      ListFoodId, foodId, // fat_remaining
      diaryId          // diary_id
    ], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};
const increaseNutritionRemain = (ListFoodId, foodId, diaryId) => {
  const updateQuery = `
    UPDATE diary 
SET 
  calories_remaining = COALESCE(calories_remaining, 0) + COALESCE(
    (SELECT calories FROM listfood_food WHERE ListFood_id = ? AND food_id = ?), 0
  ),
  carbs_remaining = COALESCE(carbs_remaining, 0) + COALESCE(
    (SELECT carbs FROM listfood_food WHERE ListFood_id = ? AND food_id = ?), 0
  ), 
  protein_remaining = COALESCE(protein_remaining, 0) + COALESCE(
    (SELECT protein FROM listfood_food WHERE ListFood_id = ? AND food_id = ?), 0
  ), 
  fat_remaining = COALESCE(fat_remaining, 0) + COALESCE(
    (SELECT fat FROM listfood_food WHERE ListFood_id = ? AND food_id = ?), 0
  )
WHERE diary_id = ?;

  `;
  return new Promise((resolve, reject) => {
    connection.query(updateQuery, [
      ListFoodId, foodId, // calories_remaining
      ListFoodId, foodId, // carbs_remaining
      ListFoodId, foodId, // protein_remaining
      ListFoodId, foodId, // fat_remaining
      diaryId
    ], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};
// Lưu dinh dưỡng cần nạp theo chế độ vào bảng Diary
const saveDiaryEntry = (diaryId, adjustedTDEE, macros) => {
  return new Promise((resolve, reject) => {
    const { protein, carbs, fat } = macros;
    const query = `
      Update diary set 
      calories_remaining = ?, 
      protein_remaining = ?,
      carbs_remaining = ?,
      fat_remaining = ?
      where diary_id = ?                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
  `;
    connection.query(query, [adjustedTDEE, protein, carbs, fat, diaryId,], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};
// Tạo mới 1 diary khi người dùng nhập date mới
const newDiary = (date, userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO diary (date, user_id)
      VALUES (?, ?)
  `;
    connection.query(query, [date, userId], (err, results) => {
      if (err) reject(err);
      else resolve({ diaryId: results.insertId });
    });
  });
};
const getDiary = (date, userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      Select * From diary 
      Where date = ? AND user_id = ?
  `;
    connection.query(query, [date, userId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};
const getReportDetails = (userId, days) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT calories_consumed as calories_consumed, DATE_FORMAT(date, '%Y-%m-%d') AS date
      FROM diary 
      WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;
    connection.query(query, [userId, days], (err, results) => {
      if (err) {
        return reject(err); // Trả về lỗi nếu có
      }
      resolve(results); // Trả về kết quả nếu thành công
    });
  });
};
const getReport = (userId, days) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT Sum(calories_consumed)
      FROM diary 
      WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;
    connection.query(query, [userId, days], (err, results) => {
      if (err) {
        return reject(err); // Trả về lỗi nếu có
      }
      resolve(results); // Trả về kết quả nếu thành công
    });
  });
};
const updateNutritionRemain = (diaryId) => {
  const updateQuery = `
    UPDATE diary 
SET 
  calories_remaining = COALESCE(calories_remaining, 0) - COALESCE(
    (SELECT Sum(ListFood_calories) FROM listfood WHERE diary_id = ?), 0
  ),
  carbs_remaining = COALESCE(carbs_remaining, 0) - COALESCE(
    (SELECT Sum(ListFood_carbs) FROM listfood WHERE diary_id = ?), 0
  ), 
  protein_remaining = COALESCE(protein_remaining, 0) - COALESCE(
    (SELECT Sum(ListFood_protein) FROM listfood WHERE diary_id = ?), 0
  ), 
  fat_remaining = COALESCE(fat_remaining, 0) + COALESCE(
    (SELECT Sum(ListFood_fat) FROM listfood WHERE diary_id = ?), 0
  )
WHERE diary_id = ?;

  `;
  return new Promise((resolve, reject) => {
    connection.query(updateQuery, [
      diaryId, // calories_remaining
      diaryId, // carbs_remaining
      diaryId, // protein_remaining
      diaryId, // fat_remaining
      diaryId
    ], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};


const addListFoodtoDiary = (diaryId, ListFoodId) => {
  return new Promise((resolve, reject) => {
    const query = `
      Insert into diary_listfood (diary_id, ListFood_ID) values (?, ?);
  `;
    connection.query(query, [diaryId, ListFoodId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};
module.exports = {
  addListFoodtoDiary,
  getUserDiary,
  getCaloriesGoal,
  increaseNutritionRemain,
  decreaseNutritionRemain,
  updateNutritionConsumed,
  saveDiaryEntry,
  getDiary,
  newDiary,
  getReport,
  getReportDetails,
  updateNutritionRemain
};