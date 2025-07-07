# ✅ Updated `database.py` with context helpers
from pymongo import MongoClient
import os
from datetime import datetime
import pytz

uri = os.getenv("MONGO_URI")

# Initialize collections
collection = None
whatsapp_collection = None

try:
    client = MongoClient(uri)
    db = client.get_database("test-sam")
    collection = db.get_collection("chatbot")
    whatsapp_collection = db.get_collection("whatsapp_queries")
except Exception as e:
    print("❌ Error connecting to MongoDB:", e)

# 🔹 Fetch past conversation for a thread (latest 5)
def get_conversation(thread_id):
    if collection is None:
        return []
    try:
        results = (
            collection.find({"thread_id": thread_id})
            .sort("timestamp", -1)
            .limit(5)
        )
        return list(results)[::-1]  # Return in chronological order
    except Exception as e:
        print("❌ Error fetching conversation:", e)
        return []

# 🔹 Save new conversation

def save_conversation(thread_id, user_msg, bot_reply):
    if collection is None:
        return
    try:
        collection.insert_one({
            "thread_id": thread_id,
            "query": user_msg,
            "response": bot_reply,
            "timestamp": datetime.now(pytz.utc),
        })
    except Exception as e:
        print("❌ Error saving conversation:", e)
