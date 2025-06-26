from pymongo import MongoClient
import os

uri = os.getenv("uri")

# Initialize collections as None
collection = None
whatsapp_collection = None

try:
    client = MongoClient(uri)

    # Define the database
    db = client.get_database("test-sam")

    # Collection for chatbot messages
    collection = db.get_collection("chatbot")

    # Collection for WhatsApp queries
    whatsapp_collection = db.get_collection("whatsapp_queries")

except Exception as e:
    print("❌ Error connecting to MongoDB:", e)
