"""
Convert the Master Letterhead to PDF
"""

from docx2pdf import convert
import os

def convert_to_pdf():
    """Convert the DOCX letterhead to PDF"""
    
    docx_path = r"C:\Users\ashra\OneDrive\Desktop\AHK_Dashboard_v1\Brand\Letterheads\AHKStrategies_Letterhead_Master_v1.docx"
    pdf_path = r"C:\Users\ashra\OneDrive\Desktop\AHK_Dashboard_v1\Brand\Letterheads\AHKStrategies_Letterhead_Master_v1.pdf"
    
    if not os.path.exists(docx_path):
        print(f"❌ DOCX file not found: {docx_path}")
        return
    
    print("🔄 Converting DOCX to PDF...")
    print("   This may take a moment as Word is being invoked...")
    
    try:
        convert(docx_path, pdf_path)
        print("\n" + "=" * 80)
        print("✨ PDF EXPORT COMPLETE ✨")
        print("=" * 80)
        print(f"📄 PDF: {pdf_path}")
        print(f"✅ Both formats ready for professional use!")
        print("=" * 80)
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
        print("\nNote: docx2pdf requires Microsoft Word to be installed.")
        print("Alternative: Open the DOCX file and use 'Save As > PDF' manually.")

if __name__ == "__main__":
    convert_to_pdf()
