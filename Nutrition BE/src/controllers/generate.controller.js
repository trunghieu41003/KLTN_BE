const { exec } = require("child_process");

const generateMealPlan = async (req, res) => {
    try {
        console.log("Request body:", req.body);  // Kiểm tra dữ liệu từ body
        const { userId, date } = req.body; // Lấy userId từ request
        const token = req.token;
        if (!userId) {
            return res.status(400).json({ error: "Thiếu userId" });
        }

        exec(`python ./src/generate_meal_plan.py ${userId} ${token} ${date}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return res.status(500).json({ error: "Lỗi khi tạo lịch ăn" });
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
            }
            console.log(`Success: ${stdout}`);
            return res.status(200).json({ message: "Tạo lịch ăn thành công!" });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Có lỗi xảy ra" });
    }
};

module.exports = { generateMealPlan };
