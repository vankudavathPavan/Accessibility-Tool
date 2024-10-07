from flask import Flask, request, Response
from flask_cors import CORS
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from transformers import pipeline  # Import the summarization pipeline

# Initialize the Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the summarization pipeline
summarizer = pipeline("summarization")

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

        # Extract text content from paragraphs and headers
        # text_content = ' '.join([p.get_text() for p in soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])])
        text_content = """
            In physics, gravity is a fundamental interaction primarily observed as mutual attraction between all things that have mass. 
            Gravity is, by far, the weakest of the four fundamental interactions, approximately 1038 times weaker than the strong interaction, 1036 times weaker than the electromagnetic force and 1029 times weaker than the weak interaction. 
        """

        # Summarize the text content
        summary = summarizer(text_content, max_length=100, min_length=13, do_sample=False)

        # Return the modified HTML content and the summary
        print("Returning data")
        return str(soup), summary[0]['summary_text'], response.headers.get('Content-Type', 'text/html')

    except requests.exceptions.RequestException as e:
        return f"Error fetching the URL: {str(e)}", '', 'text/html'

@app.route('/', methods=['POST'])
def index():
    # Get the URL from the JSON request
    url = request.json.get('url')  
    if url:
        html_content, summary, content_type = fetch_and_render_url(url)
        # Return the HTML content and the summary as JSON
        return Response({"html": html_content, "summary": summary}, content_type='application/json')
    return Response("No URL provided", content_type='text/plain')

# Optional: Uncomment this section if you want to implement image processing
# @app.route('/process-image', methods=['POST'])
# def upload_image():
#     if 'image' not in request.files:
#         return Response("No image uploaded", status=400)

#     image_file = request.files['image']
#     description = process_image(image_file)
#     return Response({"description": description}, content_type='application/json')

if __name__ == '__main__':
    app.run(debug=True)
