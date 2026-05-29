import codecs
import os

path = r"app/api/recommend/route.ts"
if os.path.exists(path):
    try:
        with codecs.open(path, "r", encoding="cp949") as f:
            content = f.read()
        print("Read as cp949 successfully")
    except Exception as e:
        print("Failed to read as cp949:", e)
        with codecs.open(path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        print("Read as utf-8 (ignore errors)")
    
    with codecs.open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully converted and saved as UTF-8")
else:
    print(f"File not found: {path}")
