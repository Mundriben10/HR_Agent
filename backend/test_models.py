import os
from dotenv import load_dotenv
import requests

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
response = requests.get(url)
data = response.json()

for model in data.get('models', []):
    print(model['name'])
