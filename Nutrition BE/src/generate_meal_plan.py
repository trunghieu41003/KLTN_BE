import os
import sys
import mysql.connector
import pandas as pd
import requests
import random
from datetime import datetime, timedelta
import numpy as np
from itertools import combinations
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv()


user_id = sys.argv[1]
token = sys.argv[2]
date = sys.argv[3]

# Database configuration
db_config = {
    "host": os.getenv("HOST_NAME_DB"),
    "user": os.getenv("USER_DB"),
    "password": os.getenv("PASSWORD_DB"),
    "database": os.getenv("DATABASE")
}

# Kết nối database
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor(dictionary=True)

# Lấy thông tin người dùng
cursor.execute("SELECT user_id, calories_daily, health_conditions FROM user WHERE user_id = %s", (user_id,))
user = cursor.fetchone()

# Lấy lịch sử món ăn của user
cursor.execute("""
    SELECT f.name_food 
    FROM listfood_food lff
    JOIN food f ON lff.food_id = f.food_id
    JOIN listfood lf ON lff.ListFood_id = lf.ListFood_id
    JOIN meal m ON m.meal_id = lf.meal_id
    JOIN diary_listfood dl ON dl.ListFood_ID = lf.ListFood_ID
    JOIN diary d ON d.diary_id = dl.diary_id
    WHERE d.diary_id = %s
""", (user_id,))
history_dishes = [row["name_food"] for row in cursor.fetchall()]

# Đọc file món ăn
file_path = "./dataset/ingredient updated.xlsx"
df = pd.read_excel(file_path)
df.columns = df.columns.str.strip().str.lower()
df = df.dropna(subset=["dishes", "ingredients", "gram", "calories"])
df["dishes"] = df["dishes"].astype(str).str.split(", ")
df["ingredients"] = df["ingredients"].astype(str).str.split(", ")
df = df.explode("dishes").explode("ingredients")

# Chuyển đổi giá trị số
def convert_to_float(value):
    try:
        return float(str(value).replace(",", "."))
    except ValueError:
        return 0

for col in ["calories", "fat", "carb", "protein", "cholesterol", "gram"]:
    df[col] = df[col].apply(convert_to_float)

# Nhóm theo món ăn
grouped = df.groupby("dishes").agg({
    "calories": "sum",
    "fat": "sum",
    "carb": "sum",
    "protein": "sum",
    "cholesterol": "sum",
    "gram": "sum"
}).reset_index()
health_condition = user["health_conditions"]
# Lấy danh sách nguyên liệu từ món trong lịch sử
history_ingredients = df[df["dishes"].isin(history_dishes)]["ingredients"].unique()
# Hàm tạo thực đơn
print("Lịch sử món ăn của user:", history_dishes)
print("Tình trạng sức khỏe của user:", health_condition)

def generate_meal_plan(calories_daily):

    if not history_dishes and not health_condition:
    # Nếu không có lịch sử món ăn và không có bệnh → chọn ngẫu nhiên
        selected_dishes = grouped.sample(n=3)
    else:
    # Chọn món ăn trong lịch sử trước
        history_selected = grouped[grouped["dishes"].isin(history_dishes)]

        if health_condition:
        # Chỉ lấy món có cholesterol = 0
            low_cholesterol_dishes = grouped[grouped["cholesterol"] == 0]
            history_selected = history_selected[history_selected["cholesterol"] == 0]

        # Nếu chưa đủ 3 món, bổ sung từ danh sách cholesterol = 0
            if len(history_selected) < 3:
                additional_dishes = low_cholesterol_dishes.sample(n=3-len(history_selected), random_state=None)
                history_selected = pd.concat([history_selected, additional_dishes]).drop_duplicates()

        # Nếu vẫn chưa đủ 3 món, chọn thêm món cholesterol thấp nhất
            if len(history_selected) < 3:
                extra_dishes = grouped.nsmallest(3 - len(history_selected), "cholesterol")
                selected_dishes = pd.concat([history_selected, extra_dishes])
            else:
                selected_dishes = history_selected

        else:
        # Nếu không có bệnh, chọn món ăn cũ hoặc món có chung nguyên liệu
            similar_dishes = df[df["ingredients"].isin(history_ingredients)]["dishes"].unique()
            additional_dishes = grouped[grouped["dishes"].isin(similar_dishes)]

        # Ghép danh sách lại và loại bỏ trùng lặp
            selected_dishes = pd.concat([history_selected, additional_dishes]).drop_duplicates()

        # Nếu chưa đủ 3 món, lấy thêm món ngẫu nhiên
            if len(selected_dishes) < 3:
                extra_dishes = grouped.sample(n=3-len(selected_dishes), random_state=None)
                selected_dishes = pd.concat([selected_dishes, extra_dishes]).drop_duplicates()

    # Giữ đúng 3 món
    selected_dishes = selected_dishes.head(3)

    # Chọn tổ hợp 3 món có tổng calories gần nhất với calories_daily
    best_combination = None
    best_diff = float("inf")

    for combo in combinations(selected_dishes.itertuples(index=False), 3):
        total_calories = sum(item.calories for item in combo)
        diff = abs(float(calories_daily) - total_calories)
        if diff < best_diff:
            best_diff = diff
            best_combination = combo
        if best_diff == 0:
            break

    # Tính toán dinh dưỡng cho 3 món
    if best_combination:
        total_calories = sum(item.calories for item in best_combination)
        scale_factor = float(calories_daily) / total_calories

        meal_plan = []
        for item in best_combination:
            ingredients_df = df[df["dishes"] == item.dishes].copy()
            ingredients_df["gram"] *= scale_factor

            meal_plan.append({
                "foodId": item.dishes,
                "portion": round(item.gram * scale_factor, 2),
                "calories": round(item.calories * scale_factor, 2),
                "carbs": round(item.carb * scale_factor, 2),
                "fat": round(item.fat * scale_factor, 2),
                "protein": round(item.protein * scale_factor, 2),
                "ingredients": [{"name": row.ingredients, "gram": row.gram} for _, row in ingredients_df.iterrows()]
            })
        return meal_plan
    else:
        return []
# Truy vấn food_id từ tên món ăn
def get_food_id(food_name):
    cursor.execute("SELECT food_id FROM food WHERE name_food = %s", (food_name,))
    result = cursor.fetchone()
    return result["food_id"] if result else None

def send_food_to_api(meal_data, user_id, meal_id, date):
    api_url = f"http://localhost:3000/api/auth/meals/{meal_id}/foods"
    headers = {"Authorization": f"Bearer {token}"}

    for food in meal_data:
        food_id = get_food_id(food["foodId"])  # Lấy food_id từ tên món ăn
        if not food_id:
            print(f"⚠️ Không tìm thấy food_id cho món: {food['foodId']}")
            continue

        payload = {
            "userId": user_id,
            "date": date,
            "foodId": food_id,  # Gửi ID thay vì tên
            "portion": 1,
            "calories": food["calories"],
            "carbs": food["carbs"],
            "fat": food["fat"],
            "protein": food["protein"],
            "ingredients": food["ingredients"]
        }
        response = requests.post(api_url, json=payload, headers=headers)
        if response.status_code == 200:
            print(f"✅ Đã gửi dữ liệu thành công cho bữa {meal_id} ngày {date}")
        else:
            print(f"❌ Lỗi khi gửi dữ liệu: {response.text}")

def create_diary_entry(user_id, date):
    api_url = "http://localhost:3000/api/auth/diaries"
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "userId": user_id,
        "date": date
    }

    response = requests.post(api_url, json=payload, headers=headers)

    if response.status_code == 200:
        print(f"✅ Nhật ký ăn uống cho ngày {date} đã được tạo thành công!")
    else:
        print(f"❌ Lỗi khi tạo nhật ký ăn uống: {response.text}")

# Tạo thực đơn 7 ngày và gửi API
calories_daily = user["calories_daily"]
start_date = datetime.today()

for day in range(7):
    date = (start_date + timedelta(days=day)).strftime("%Y-%m-%d")
    create_diary_entry(user_id, date)
    meal_ids = [1, 2, 3]  # 3 bữa/ngày

    meal_plan = generate_meal_plan(calories_daily)

    for i in range(3):
        send_food_to_api([meal_plan[i]], user_id, meal_ids[i], date)


print(f"🎉 Hoàn thành tạo lịch ăn cho user {user_id} từ ngày {start_date.strftime('%Y-%m-%d')} đến {date}!")
