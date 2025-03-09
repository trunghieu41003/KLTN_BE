
const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.HOST_NAME_DB,
    user: process.env.USER_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

module.exports = pool;
