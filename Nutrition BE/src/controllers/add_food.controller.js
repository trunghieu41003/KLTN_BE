const { exec } = require("child_process");

const addFoodToMeal = async (req, res) => {
    try {
        console.log("Request body:", req.body);  // Kiểm tra dữ liệu từ body

        const { userId, portion, foodId, date, mealId } = req.body;
        const token = req.token;

        if (!userId || !portion || !foodId || !date || !mealId) {
            return res.status(400).json({ error: "Thiếu tham số yêu cầu" });
        }

        exec(`python ./src/add_food.py ${userId} ${token} ${portion} ${foodId} ${date} ${mealId}`,
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error: ${error.message}`);
                    return res.status(500).json({ error: "Lỗi khi thêm món ăn" });
                }
                if (stderr) {
                    console.error(`Stderr: ${stderr}`);
                }
                console.log(`Success: ${stdout}`);
                return res.status(200).json({ message: "Thêm món ăn thành công!", output: stdout });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Có lỗi xảy ra" });
    }
};

module.exports = { addFoodToMeal };
