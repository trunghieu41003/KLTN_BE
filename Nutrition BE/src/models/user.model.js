// src/model/foodModel.js
const connection = require('../config/database');

// Tìm người dùng theo email
const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM user WHERE email = ?', [email], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results[0]); // Nếu không có lỗi, trả về kết quả tìm thấy
    });
  });
};

const findUserByID = (userId) => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT *, DATE_FORMAT(birthday, "%Y-%m-%d") AS birthday FROM user WHERE user_id = ?',
      [userId],
      (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results[0]); // Trả về toàn bộ kết quả, bao gồm cả ngày đã định dạng
      }
    );
  });
};


// Tạo người dùng mới
const createUser = (userData) => {
  return new Promise((resolve, reject) => {
    const { name, email, password, height, weight, birthday, gender, activity_level } = userData;
    connection.query(
      'INSERT INTO user (name, email, password, height, weight, birthday, gender, activity_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, password, height, weight, birthday, gender, activity_level],
      (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve({ userId: results.insertId, ...userData }); // Trả về dữ liệu người dùng mới
      }
    );
  });
};


// Cập nhật thông tin User
const updateUser = (id, userData) => {
  return new Promise((resolve, reject) => {
    const updateQuery = 'UPDATE user SET ? WHERE user_id = ?';
    connection.query(updateQuery, [userData, id], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

const updateUserInformation = (userId, user) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE user SET ';
    let params = [];
    let setClause = []; // Mảng để lưu các điều kiện set

    // Xây dựng câu truy vấn động
    if (user.weight) {
      setClause.push('weight = ?');
      params.push(user.weight);
    }
    if (user.height) {
      setClause.push('height = ?');
      params.push(user.height);
    }

    if (user.birthday) {
      setClause.push('birthday = ?');
      params.push(user.birthday);
    }
    if (user.gender) {
      setClause.push('gender = ?');
      params.push(user.gender);
    }
    if (user.activity_level) {
      setClause.push('activity_level = ?');
      params.push(user.activity_level);
    }
    if (user.name) {
      setClause.push('name = ?');
      params.push(user.name);
    }
    if (user.email) {
      setClause.push('email = ?');
      params.push(user.email);
    }
    if (user.password) {
      setClause.push('password = ?');
      params.push(user.password);
    }
    // Nếu không có trường nào để cập nhật, chỉ cần resolve mà không thực hiện truy vấn
    if (setClause.length === 0) {
      return resolve({ message: 'Không có trường nào để cập nhật, không thực hiện thay đổi.' });
    }

    // Kết hợp các điều kiện set thành một chuỗi
    query += setClause.join(', '); // Thêm điều kiện vào câu truy vấn

    // Thêm điều kiện WHERE
    query += ' WHERE user_id = ?';
    params.push(userId);

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

const updateCaloriesDaily = (userId, CaloriesDaily) => {
  return new Promise((resolve, reject) => {
    const getQuery = 'Update user SET calories_daily = ? where user_id = ?';
    connection.query(getQuery, [CaloriesDaily, userId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};


const updateUserPassword = (email, newPassword) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'UPDATE User SET password = ? WHERE email = ?',
      [newPassword, email],
      (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results); // Return the result of the update
      }
    );
  });
};

module.exports = {
  createUser,
  updateUser,
  findUserByEmail,
  createUser,
  updateUserPassword,
  findUserByID,
  updateUserInformation,

  updateCaloriesDaily
};