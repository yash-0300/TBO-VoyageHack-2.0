from flask import Flask, render_template, request, jsonify
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
import json
import markdown2
from bs4 import BeautifulSoup

app = Flask(__name__)

# Initialize Gemini AI client
client = genai.Client(api_key='AIzaSyBMsV31Je5XTOohCK2PqFWRFNE3rLirf_E')
model_id = "gemini-2.0-flash-exp"

google_search_tool = Tool(
    google_search=GoogleSearch()
)

system_prompt = """You are a specialized hotel search and recommendation AI assistant with access to Google Search,
Google Hotels, and Google Maps data thorough internet/google search. 
Your response should be in proper markdown format with following sections:
## Hotel Name
### Description
Brief description of the hotel

### Location
Address and location details

### Price
Price range and rates

### Amenities
List of key amenities

### Links
- Google Maps link
- Hotel website
- Image gallery

Please ensure all responses maintain this markdown structure.
"""

@app.route('/')
def home():
    return render_template("index.html", title="VoyageHack 2.0")

@app.route('/chatbot')
def chatbot():
    return render_template('search.html')

@app.route('/api/search', methods=['POST'])
def search():
    try:
        data = request.get_json()
        query = data.get('query', '')

        # Generate response using Gemini AI
        response = client.models.generate_content(
            model=model_id,
            contents=query,
            config=GenerateContentConfig(
                system_instruction=system_prompt,
                tools=[google_search_tool],
                response_modalities=["TEXT"],
            )
        )

        final_response = ""
        for each in response.candidates[0].content.parts:
            final_response += each.text

        return jsonify({
            "message": format_chat_response(final_response),
            "raw_data": final_response
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "Sorry, I encountered an error. Please try again."
        }), 500

@app.route('/api/process-image', methods=['POST'])
def process_image():
    return jsonify({
        "description": "I see a hotel image. This appears to be a luxury hotel with modern architecture.",
        "message": "Currently, image processing is under development. I can see that you've shared a hotel image with me. How else can I help you find the perfect hotel?"
    })

def format_chat_response(hotel_data):
    """
    Format the hotel data into properly formatted markdown using markdown2 library
    
    Args:
        hotel_data (str): Raw hotel information text
        
    Returns:
        str: Formatted markdown string
    """
    try:
        # Convert markdown to HTML first to ensure proper formatting
        html = markdown2.markdown(hotel_data, extras=['tables', 'fenced-code-blocks'])
        
        # Parse HTML with BeautifulSoup to clean and structure content
        soup = BeautifulSoup(html, 'html.parser')
        
        # Clean up any unwanted HTML elements
        for tag in soup(['script', 'style']):
            tag.decompose()
            
        # Convert links to markdown format
        for a in soup.find_all('a'):
            href = a.get('href', '')
            text = a.get_text()
            if 'maps.google' in href.lower():
                a.replace_with(f"🗺️ [View on Google Maps]({href})")
            elif any(ext in href.lower() for ext in ['.jpg', '.png', '.jpeg']):
                a.replace_with(f"📷 [View Hotel Images]({href})")
            else:
                a.replace_with(f"🏨 [{text}]({href})")
        
        # Convert back to markdown
        clean_text = soup.get_text()
        
        # Ensure proper markdown headers
        sections = clean_text.split('\n')
        formatted_sections = []
        
        for section in sections:
            section = section.strip()
            if section:
                # Ensure proper header formatting
                if section.startswith('#'):
                    if not section.startswith('# '):
                        section = section.replace('#', '# ', 1)
                formatted_sections.append(section)
        
        # Join sections with proper spacing
        formatted_markdown = '\n\n'.join(formatted_sections)
        
        # If the response is empty or not properly formatted, return a formatted version of raw data
        if not formatted_markdown.strip():
            return "### Hotel Information\n\n" + hotel_data
            
        return formatted_markdown
        
    except Exception as e:
        # Fallback to basic formatting if markdown processing fails
        return "### Hotel Information\n\n" + hotel_data

if __name__ == '__main__':
    app.run(debug=True)