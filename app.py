from flask import Flask, render_template, request, Response
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

app = Flask(__name__)

# Wikipedia API base URL
WIKIPEDIA_API_BASE_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/"

# Function to fetch and render a page, including external resources
def fetch_and_render_url(url):
    try:
        # Fetch the content from the given URL
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad responses

        # Parse the HTML with BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')

        # Update stylesheets (CSS), scripts (JS), and images (IMG) to be absolute URLs
        for link in soup.find_all('link', href=True):
            link['href'] = urljoin(url, link['href'])

        for script in soup.find_all('script', src=True):
            script['src'] = urljoin(url, script['src'])

        for img in soup.find_all('img', src=True):
            img['src'] = urljoin(url, img['src'])

        # Add a speaker button next to each <p> tag
        for p in soup.find_all('p'):
            speaker_button = soup.new_tag('button', **{'class': 'speaker-button'})
            speaker_button.string = "🔊"
            speaker_button['onclick'] = f"readContent('{p.get_text()}')"
            p.insert_after(speaker_button)

        # Return the modified HTML content
        return str(soup), response.headers.get('Content-Type', 'text/html')
    except requests.exceptions.RequestException as e:
        return f"Error fetching the URL: {str(e)}", 'text/html'

# Route to handle requests for external API endpoints
@app.route('/api/rest_v1/page/summary/<path:title>')
def get_wikipedia_summary(title):
    # Forward the request to the Wikipedia API
    api_url = f"{WIKIPEDIA_API_BASE_URL}{title}"
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        return Response(response.content, content_type=response.headers.get('Content-Type'))
    except requests.exceptions.RequestException as e:
        return f"Error fetching data from Wikipedia: {str(e)}", 404

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        url = request.form.get('url')
        if url:
            # Call the function to fetch and render the page
            html_content, content_type = fetch_and_render_url(url)
            return Response(html_content, content_type=content_type)
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
