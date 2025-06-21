from pymongo import MongoClient
import os
# Replace with your actual MongoDB URI
uri = os.getenv("uri")
collection=None
# Connect to MongoDB Atlas
try:
    client = MongoClient(uri)

    # Select a database and collection
    db = client['test-sam']
    collection = db['chatbot']
    # Insert a document
    #collection.insert_one({"name": "Alice", "age": 69})

    # Find the document
    #result = collection.find_one({"name": "Alice"})
    #print(result)
except Exception as e:
    print("error in database",e)