import pdfplumber
import os

def extract():
    files = [f for f in os.listdir('.') if f.endswith('.pdf')]
    out = []
    for f in files:
        try:
            with pdfplumber.open(f) as pdf:
                text = "".join([p.extract_text() for p in pdf.pages])
                out.append(f"--- {f} ---\n{text}")
        except Exception as e:
            out.append(f"--- {f} ---\nError: {e}")
    
    with open("output.txt", "w", encoding="utf-8") as out_file:
        out_file.write("\n\n".join(out))

if __name__ == "__main__":
    extract()
