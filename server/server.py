from flask import Flask, request, Response
from flask_cors import CORS
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from googletrans import Translator
# from models.image2text import process_image

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

translator = Translator()  # Initialize the Google Translator

# Function to fetch and return the HTML from a given URL
def fetch_and_render_url(url):
    try:
        # Fetch the content from the URL
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad responses

        # Parse the HTML with BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')

        # Update the links (CSS, JS, IMG) to use absolute paths
        for link in soup.find_all('link', href=True):
            link['href'] = urljoin(url, link['href'])

        for script in soup.find_all('script', src=True):
            script['src'] = urljoin(url, script['src'])

        for img in soup.find_all('img', src=True):
            img['src'] = urljoin(url, img['src'])

        # Return the modified HTML content
        return str(soup), response.headers.get('Content-Type', 'text/html')

    except requests.exceptions.RequestException as e:
        return f"Error fetching the URL: {str(e)}", 'text/html'

@app.route('/', methods=['POST'])
def index():
    url = request.json.get('url')  # Assuming we're sending JSON from React
    if url:
        html_content, content_type = fetch_and_render_url(url)
        return Response(html_content, content_type=content_type)
    return Response("No URL provided", content_type='text/plain')

# Endpoint to handle translations
@app.route('/translate', methods=['POST'])
def translate_text():
    text = request.json.get('text')
    target_lang = request.json.get('target_lang')
    if text and target_lang:
        try:
            translated = translator.translate(text, dest=target_lang)
            return Response(translated.text, content_type='text/plain')
        except Exception as e:
            return Response(f"Translation error: {str(e)}", status=400)
    return Response("Invalid input", status=400)

# @app.route('/process-image', methods=['POST'])
# def upload_image():
#     if 'image' not in request.files:
#         return Response("No image uploaded", status=400)

#     image_file = request.files['image']

#     description = process_image(image_file)

#     return Response({"description": description}, content_type='application/json')

if __name__ == '__main__':
    app.run(debug=True)
