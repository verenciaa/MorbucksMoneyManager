import gradio as gr
from transformers import AutoTokenizer, VisionEncoderDecoderModel, DonutImageProcessor
from PIL import Image
import torch

# Load the tokenizer, model, and feature extractor
tokenizer = AutoTokenizer.from_pretrained("jinhybr/OCR-Donut-CORD")
model = VisionEncoderDecoderModel.from_pretrained("jinhybr/OCR-Donut-CORD")
feature_extractor = DonutImageProcessor.from_pretrained("jinhybr/OCR-Donut-CORD")

# Function to preprocess the image
def preprocess_image(image):
    image = image.convert("RGB")
    return image

# Function to predict text from the image
def predict_receipt(image):
    try:
        # Preprocess the image
        image = preprocess_image(image)
        
        # Convert image to tensor
        pixel_values = feature_extractor(images=image, return_tensors="pt").pixel_values
        
        # Perform inference
        with torch.no_grad():
            outputs = model.generate(pixel_values)
        
        # Decode the outputs
        predicted_text = tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]
        
        return predicted_text
    except Exception as e:
        return f"Error during prediction: {e}"

# Clean up the output
def clean_receipt_text(text):
    try:
        # Replace tags and extra spaces
        text = text.replace('<s_', '').replace('</s_', '').replace('>', ': ').replace('</s', '').replace('<sep/:', '\n')
        # Split the text into lines
        lines = text.split('\n')
        cleaned_lines = []
        for line in lines:
            # Remove extra colons and spaces
            cleaned_line = ' '.join(line.split()).replace(' :', ':')
            cleaned_lines.append(cleaned_line)
        cleaned_text = '\n'.join(cleaned_lines)
        return cleaned_text
    except Exception as e:
        return f"Error during text cleaning: {e}"

# Function to extract structured information from cleaned receipt text
def extract_receipt_details(cleaned_text):
    try:
        details = {
            'total_price': None,
            'items': []
        }
        lines = cleaned_text.split('\n')
        current_section = None
        
        for line in lines:
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip().lower()  # Convert key to lowercase and remove extra spaces
                value = value.strip()  # Remove extra spaces from value
                
                if key in ['date', 'time', 'total', 'subtotal', 'tax', 'total_price']:
                    details[key] = value
                elif key == 'menu':
                    current_section = 'items'
                elif current_section == 'items':
                    if 'nm:' in line and 'num:' in line and 'unitprice:' in line and 'price:' in line:
                        item_name = line.split('nm:')[1].split('num:')[0].strip()
                        item_quantity = line.split('num:')[1].split('unitprice:')[0].strip()
                        item_unitprice = line.split('unitprice:')[1].split('price:')[0].strip()
                        item_price = line.split('price:')[1].strip()
                        details['items'].append({
                            'item_name': item_name,
                            'item_quantity': item_quantity,
                            'item_unitprice': item_unitprice,
                            'item_price': item_price
                        })
        
        return details
    except Exception as e:
        return {'total_price': f'Error during detail extraction: {e}', 'items': []}

# Function to handle Gradio inputs and outputs
def process_receipt(image):
    # Predict the receipt text
    receipt_text = predict_receipt(image)
    
    # Clean the receipt text
    cleaned_receipt_text = clean_receipt_text(receipt_text)

    # Extract structured details from cleaned receipt text
    receipt_details = extract_receipt_details(cleaned_receipt_text)
    
    # Return the total price and debug information
    return {
        "Predicted Text": receipt_text,
        "Cleaned Text": cleaned_receipt_text,
        "Extracted Details": receipt_details,
        "Total Price": receipt_details.get('total_price', 'Total not found')
    }

# Set up Gradio interface
demo = gr.Interface(
    fn=process_receipt,
    inputs=gr.Image(type="pil"),
    outputs="json",
    title="Receipt Reader",
    description="Upload an image of a receipt to extract the total price."
)

if __name__ == "__main__":
    demo.launch()
