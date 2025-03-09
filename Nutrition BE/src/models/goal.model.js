const connection = require('../config/database');

// Thêm một mục tiêu cho user
const newGoal = (goalData) => {
  return new Promise((resolve, reject) => {
    const { goal_type, weight_goal } = goalData;
    connection.query('INSERT INTO goal (goal_type, weight_goal) VALUES (?, ?)', [goal_type, weight_goal], (err, result) => {
      if (err) reject(err);
      else resolve({ goalId: result.insertId, ...goalData });
    });
  });
};

// Cập nhật lại mục tiêu
const updateGoal = (goalId, goalData) => {
  return new Promise((resolve, reject) => {
    connection.query('Update goal SET ? where goal_id = ?', [goalData, goalId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

// Thêm một mục tiêu cho user
const linkUserGoal = (goalId, userId) => {
  return new Promise((resolve, reject) => {
    connection.query('INSERT INTO user_goal (goal_id, user_id) VALUES (?, ?)', [goalId, userId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};


const updatedaytoGoal = (goalId, daytoGoal) => {
  return new Promise((resolve, reject) => {
    connection.query('Update goal SET days_to_goal = ? Where goal_id = ?', [daytoGoal, goalId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Thêm một mục tiêu cho user
const getGoalinformation = (goalId) => {
  return new Promise((resolve, reject) => {
    const query = `
      Select goal_type, weight_goal,DATE_FORMAT(days_to_goal, '%Y-%m-%d') AS date 
      FROM goal WHERE goal_id = ?`
    connection.query(query, [goalId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

const findGoalbyUser = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM goal 
      WHERE goal_id IN (
        SELECT ug.goal_id
        FROM user_goal ug 
        WHERE ug.user_id = ?
      )
    `;
    connection.query(query, [userId], (err, results) => {
      if (err) {
        console.error('SQL Error:', err); // Log SQL error for debugging
        return reject(err); // Return if there's an error
      }
      resolve(results[0]); // Resolve with the query results
    });
  });
};

const updateUserGoal = (goalId, goal) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE goal SET ';
    let params = [];
    let setClause = []; // Mảng để lưu các điều kiện set

    // Xây dựng câu truy vấn động
    if (goal.goal_type) {
      setClause.push('goal_type = ?');
      params.push(goal.goal_type);
    }
    if (goal.weight_goal) {
      setClause.push('weight_goal = ?');
      params.push(goal.weight_goal);
    }

    // Nếu không có trường nào để cập nhật, chỉ cần resolve mà không thực hiện truy vấn
    if (setClause.length === 0) {
      return resolve({ message: 'Không có trường nào để cập nhật, không thực hiện thay đổi.' });
    }

    // Kết hợp các điều kiện set thành một chuỗi
    query += setClause.join(', '); // Thêm điều kiện vào câu truy vấn

    // Thêm điều kiện WHERE
    query += ' WHERE goal_id = ?';
    params.push(goalId);

    // Thực hiện truy vấn
    connection.query(query, params, (error, results) => {
      if (error) {
        console.error('Error updating user information:', error); // Log error
        return reject(error); // Reject the promise on error
      }
      resolve(results); // Resolve với kết quả nếu thành công
    });
  });
};

module.exports = {
  newGoal,
  updateGoal,
  linkUserGoal,
  updatedaytoGoal,
  getGoalinformation,
  findGoalbyUser,
  updateUserGoal
};