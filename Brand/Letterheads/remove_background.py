"""
Remove gray background from banner image and make it transparent
"""

from PIL import Image
import os

def remove_gray_background(input_path, output_path):
    """Remove gray/white background and make transparent"""
    
    # Open the image
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # If pixel is light gray/white (background), make it transparent
        # Check if RGB values are close to each other and high (gray/white)
        if item[0] > 200 and item[1] > 200 and item[2] > 200:
            # Make transparent
            new_data.append((255, 255, 255, 0))
        else:
            # Keep the pixel as is
            new_data.append(item)
    
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"✓ Transparent banner created: {output_path}")

if __name__ == "__main__":
    input_banner = r"C:\Users\ashra\OneDrive\Desktop\AHK_Dashboard_v1\Brand\banner_cropped.png"
    output_banner = r"C:\Users\ashra\OneDrive\Desktop\AHK_Dashboard_v1\Brand\Letterheads\banner_transparent.png"
    
    remove_gray_background(input_banner, output_banner)
