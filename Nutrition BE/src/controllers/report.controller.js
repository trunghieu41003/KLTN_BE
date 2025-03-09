const reportmodel = require('../models/diary.model');

const CaloriesReport = async (req, res) => {
  const { userId } = req.params;
  const { days } = req.query;
  try {
    const report = await reportmodel.getReport(userId, days);
    const reportDetails = await reportmodel.getReportDetails(userId, days);
    return res.status(200).json({ report, reportDetails });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  CaloriesReport
};