const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

router.get('/diaries/meals', dashboardController.getDiary);
module.exports = router;