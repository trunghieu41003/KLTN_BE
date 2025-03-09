import os
import sys
import mysql.connector
import pandas as pd
import requests
from dotenv import load_dotenv
# Load biến môi trường từ file .env
load_dotenv()

# Kiểm tra tham số đầu vào
if len(sys.argv) < 6:
    print("Thiếu tham số! Vui lòng cung cấp: user_id, token, portion, food_id, date")
    sys.exit(1)

user_id = sys.argv[1]
token = sys.argv[2]
portion = sys.argv[3]
food_id = sys.argv[4]
date = sys.argv[5]
meal_id = sys.argv[6]

# Kết nối MySQL
db_config = {
    "host": os.getenv("HOST_NAME_DB"),
    "user": os.getenv("USER_DB"),
    "password": os.getenv("PASSWORD_DB"),
    "database": os.getenv("DATABASE")
}
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor(dictionary=True)

# Lấy thông tin món ăn từ database
cursor.execute("SELECT name_food FROM food WHERE food_id = %s", (food_id,))
name_food_result= cursor.fetchone()

name_food= name_food_result["name_food"]
# Đọc dữ liệu dinh dưỡng từ file Excel
df = pd.read_excel("./dataset/ingredient updated.xlsx")

# Chuẩn hóa tên cột
df.columns = df.columns.str.strip().str.lower()

# Xử lý NaN và chuẩn hóa dữ liệu
df = df.dropna(subset=["dishes", "ingredients", "gram", "calories"])
df["dishes"] = df["dishes"].astype(str).str.split(", ")
df["ingredients"] = df["ingredients"].astype(str).str.split(", ")
df = df.explode("dishes").explode("ingredients")

# Hàm chuyển đổi số liệu dinh dưỡng
def convert_to_float(value):
    try:
        return float(str(value).replace(",", "."))  # Đổi dấu phẩy thành dấu chấm
    except ValueError:
        return 0

# Chuyển đổi dữ liệu số
for col in ["calories", "fat", "carb", "protein", "cholesterol", "gram"]:
    df[col] = df[col].apply(convert_to_float)

# Gộp các món ăn trùng lặp
grouped = df.groupby("dishes").agg({
    "calories": "sum",
    "fat": "sum",
    "carb": "sum",
    "protein": "sum",
    "cholesterol": "sum",
    "gram": "sum"
}).reset_index()

# Tìm món ăn phù hợp
matched_row = grouped[grouped["dishes"] == name_food]

if matched_row.empty:
    print(f"Không tìm thấy món ăn '{name_food}' trong danh sách Excel.")
    sys.exit(1)

row = matched_row.iloc[0]

# Tính toán giá trị dinh dưỡng theo portion
calories = row["calories"] 
fat = row["fat"] 
carb = row["carb"] 
protein = row["protein"]


# Tạo danh sách chứa ingredients với số gam
ingredients_list = []
ingredients_data = df[df["dishes"] == name_food]

if ingredients_data.empty:
    print(f"Không tìm thấy thông tin nguyên liệu của '{name_food}'.")
else:
    for _, row in ingredients_data.iterrows():
        for ingredient in row["ingredients"]:  # Lặp từng nguyên liệu
            ingredients_list.append({
                "name": ingredient,
                "gram": row["gram"]
            })

# Gửi dữ liệu lên API
def send_food_to_api():
    api_url = f"http://localhost:3000/api/auth/meals/{meal_id}/foods"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "userId": user_id,
        "date": date,
        "foodId": food_id,
        "portion": portion,
        "calories": calories,
        "carbs": carb,
        "fat": fat,
        "protein": protein,
        "ingredients": ingredients_list  # Gửi danh sách nguyên liệu
    }
    
    requests.post(api_url, json=payload, headers=headers)

send_food_to_api()

