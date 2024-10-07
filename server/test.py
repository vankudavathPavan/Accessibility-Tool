from transformers import pipeline

# Initialize summarization with BART model instead of Pegasus
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# Text to summarize
text_content = """The Inter IIT Sports Meet 2024 is set to be hosted by IIT Indore. This event, an annual tradition among
 the Indian Institutes of Technology, is one of the longest-running inter-collegiate sports competitions in India, dating 
 back to 1961. The main sports events will take place in December, while the Aquatics Meet, a part of the overall championship,
  will be held separately​
"""

# Function to split large text into smaller chunks if needed
def chunk_text(text, chunk_size=400):
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

# Summarize each chunk and combine the summaries
text_chunks = chunk_text(text_content)
summaries = [summarizer(chunk, max_length=50, min_length=20, do_sample=False, clean_up_tokenization_spaces=True)[0]['summary_text'] for chunk in text_chunks]
final_summary = ' '.join(summaries)

# Print the final summary
print(final_summary)
