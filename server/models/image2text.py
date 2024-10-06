import torch
from transformers import BlipProcessor, BlipForConditionalGeneration

# Load the processor and model
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

def process_image(image_file):
    """
    Generate a description for the given image file.

    Args:
    - image_file: An image file object.

    Returns:
    - A string description of the image.
    """
    # Open the image file and process it
    image = processor(image_file, return_tensors="pt").pixel_values

    # Generate the description using the model
    with torch.no_grad():
        generated_ids = model.generate(image)
    
    # Decode the generated ids to get the text description
    description = processor.decode(generated_ids[0], skip_special_tokens=True)
    
    return description
