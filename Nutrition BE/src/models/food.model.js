const connection = require('../config/database');

const getAllFood = (foodId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM food where food_id = ?;
  `;
    connection.query(query, [foodId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

module.exports = {
  getAllFood
} 