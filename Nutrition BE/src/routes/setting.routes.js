const express = require('express');
const router = express.Router();
const userController = require('../controllers/setting.controller');

router.put('/users', userController.updateUserInfo);
router.get('/users', userController.getUserInfo);
module.exports = router;