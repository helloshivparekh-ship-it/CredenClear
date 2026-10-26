from google import genai

# This will automatically use the GEMINI_API_KEY environment variable you set earlier
client = genai.Client()

print("Available Flash Models:")
# The models.list() function queries the API for your available models 
for model in client.models.list():
    if "flash" in model.name.lower():
        print(f" - {model.name}")