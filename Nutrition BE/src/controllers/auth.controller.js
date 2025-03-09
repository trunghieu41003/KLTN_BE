// src/controller/UserController.js
const usermodel = require('../models/user.model');
const goalmodel = require('../models/goal.model');
const listfoodmodel = require('../models/listfood.model');
const diarymodel = require('../models/diary.model');
const mymealcontroller = require('../controllers/mymeal.controller');
const TDEEService = require('../services/TDEEService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Xử lý đăng ký người dùng
const signUp = async (req, res) => {
  const { date, name, email, password, height, weight, birthday, gender, activity_level, goal_type, weight_goal } = req.body;

  try {
    // Kiểm tra xem email đã tồn tại hay chưa
    const existingUser = await usermodel.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    const newUser = await usermodel.createUser({
      name, email, password: hashedPassword, height, weight, birthday, gender, activity_level
    });
    // Tạo mục tiêu mới
    const newGoal = await goalmodel.newGoal({ goal_type, weight_goal });

    // Liên kết người dùng với mục tiêu
    await goalmodel.linkUserGoal(newGoal.goalId, newUser.userId);
    const newDiary = await diarymodel.newDiary(date, newUser.userId);

    await TDEEService.updateUserTDEEAndDiary(newUser.userId, newDiary.diaryId, newUser, newGoal, newGoal.goalId);

    console.log({ newUser, newGoal });
    const user = await usermodel.findUserByID(newUser.userId);
    const daytoGoal = await goalmodel.getGoalinformation(newGoal.goalId);
    // Trả về cả userId và goalId
    res.status(201).json({ message: 'Đăng ký thành công', user: user, goal: daytoGoal });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi đăng ký', error: error.message });
  }
};

// Xử lý đăng nhập
const logIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Kiểm tra xem email có tồn tại không
    const user = await usermodel.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Email does not exist' });
    }

    // Kiểm tra mật khẩu
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }
    // Tạo token hoặc session
    const token = jwt.sign({ userId: user.user_id, email: user.email }, 'secret_key', { expiresIn: '1h' });

    res.status(200).json({ message: 'Log in successfully', token });
  } catch (error) {
    res.status(500).json({ message: 'Error while logging in', error: error.message });
  }
};

// Xử lý đăng xuất
const logout = (req, res) => {
  // Xóa session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error while logging out' });
    }
    res.status(200).json({ message: 'Signed out successfully' });
  });
};



const nodemailer = require('nodemailer');
const userModel = require('../models/user.model'); // Thay đổi đường dẫn nếu cần thiết

// Hàm gửi email reset mật khẩu
const sendResetPasswordEmail = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng với email này' });
    }

    // Generate a token with email and expiration time (e.g., 1 hour)
    const token = jwt.sign({ email }, 'your_secret_key', { expiresIn: '1h' });

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Reset password link with token as a query parameter
    const resetLink = `https://nutrition-website-flax.vercel.app/resetpw?token=${token}`;

    // Configure the email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Yêu cầu đặt lại mật khẩu',
      html: `<p>Xin chào,</p>
             <p>Bạn đã yêu cầu đặt lại mật khẩu. Hãy nhấn vào liên kết dưới đây để đặt lại mật khẩu của bạn:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>`,
    };

    console.log("Sending reset password email to:", mailOptions.to); // Log email

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email reset mật khẩu đã được gửi thành công!' });
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi gửi email' });
  }
};

// Function to handle password reset using the token
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify the token and retrieve the email
    const decoded = jwt.verify(token, 'your_secret_key');
    const email = decoded.email;

    // Find user by email
    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    await userModel.updateUser(user.user_id, { password: hashedPassword });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error during password reset:', error);

    // Check for token expiration
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Your session expired. Please request a new password reset.' });
    }

    res.status(500).json({ message: 'Error during password reset', error: error.message });
  }
};


module.exports = {
  signUp,
  logIn,
  logout,
  sendResetPasswordEmail,
  resetPassword, // Add this line
};


