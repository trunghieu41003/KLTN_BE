const diarymodel = require('../models/diary.model');

const getDiary = async (req, res) => {
    const { userId, date } = req.query;
    try {
        const diary = await diarymodel.getDiary(date, userId);
        return res.status(200).json({ diary });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
module.exports = {
    getDiary,
};