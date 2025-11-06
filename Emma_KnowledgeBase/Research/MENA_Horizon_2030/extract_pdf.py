"""
PDF Text Extraction Script for MENA Horizon 2030
ERIC - Emma KnowledgeBase Processor
"""

import os
import re
from datetime import datetime
from pathlib import Path
from PyPDF2 import PdfReader

# File paths
PDF_PATH = Path(__file__).parent / "MENA Horizon 2030.pdf"
OUTPUT_DIR = Path(__file__).parent / "Extracted_Text"
OUTPUT_FILE = OUTPUT_DIR / "MENA_Horizon_2030_Extracted.md"

print("🚀 ERIC PDF Extraction Protocol - INITIATED")
print(f"📄 Target: {PDF_PATH.name}\n")

# Read PDF
try:
    reader = PdfReader(str(PDF_PATH))
    total_pages = len(reader.pages)
    print(f"✅ PDF Loaded Successfully")
    print(f"📊 Total Pages: {total_pages}\n")
    
    # Extract text from all pages
    raw_text = []
    for page_num, page in enumerate(reader.pages, 1):
        text = page.extract_text()
        if text.strip():
            raw_text.append(text)
        if page_num % 10 == 0:
            print(f"📖 Processing... {page_num}/{total_pages} pages")
    
    print(f"\n✅ Text Extraction Complete")
    combined_text = "\n".join(raw_text)
    print(f"📝 Raw Text Length: {len(combined_text):,} characters")
    
    # Clean the text
    print("\n🧹 Cleaning extracted text...")
    cleaned_text = combined_text
    
    # Remove common header/footer patterns
    cleaned_text = re.sub(r'Page \d+ of \d+', '', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'\d+\s*\|\s*Page', '', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'Page\s+\d+', '', cleaned_text, flags=re.IGNORECASE)
    
    # Remove watermark patterns
    cleaned_text = re.sub(r'CONFIDENTIAL|DRAFT|INTERNAL USE ONLY', '', cleaned_text, flags=re.IGNORECASE)
    
    # Clean excessive whitespace
    cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
    cleaned_text = re.sub(r'[ \t]+', ' ', cleaned_text)
    
    # Split into lines and remove duplicates while preserving order
    lines = cleaned_text.split('\n')
    unique_lines = []
    seen = set()
    
    for line in lines:
        trimmed = line.strip()
        if trimmed and trimmed not in seen:
            unique_lines.append(trimmed)
            seen.add(trimmed)
    
    final_text = '\n\n'.join(unique_lines)
    
    # Create markdown document
    markdown_content = f"""# MENA Horizon 2030 - Extracted Text
**Extracted Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Source:** MENA Horizon 2030.pdf
**Processing:** ERIC - Emma KnowledgeBase Processor
**Total Pages:** {total_pages}

---

{final_text}

---

**End of Document**
"""
    
    # Save to file
    OUTPUT_DIR.mkdir(exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    # Calculate statistics
    word_count = len(final_text.split())
    file_size = OUTPUT_FILE.stat().st_size
    file_size_kb = file_size / 1024
    
    # Get first 10 lines preview
    preview_lines = markdown_content.split('\n')[:10]
    
    print("\n" + "="*60)
    print("🎯 EXTRACTION COMPLETE!")
    print("="*60)
    print(f"📝 Word Count: {word_count:,} words")
    print(f"💾 File Size: {file_size_kb:.2f} KB")
    print(f"📍 Saved to: {OUTPUT_FILE}")
    print("\n📋 FIRST 10 LINES PREVIEW:")
    print("="*60)
    for idx, line in enumerate(preview_lines, 1):
        print(f"{idx}. {line}")
    print("="*60)
    print("\n✅ ERIC Protocol Complete - Knowledge Base Updated")
    
except Exception as e:
    print(f"❌ PDF Extraction Failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
