import os
import json
import shutil
import re
import sys

# --- Constants & Utility Functions ---
CHOSEONG = [
    'G', 'K', 'N', 'D', 'T', 'R', 'M', 'B', 'P', 'S', 'S', 'O', 'J', 'JJ', 'CH', 'K', 'T', 'P', 'H'
]

def get_first_alphabet(name):
    if not name: return 'X'
    name = name.strip().lstrip(' \t\n\r\f\v')
    if not name: return 'X'
    first_char = name[0]
    code = ord(first_char)
    if 0xAC00 <= code <= 0xD7A3:
        choseong_index = (code - 0xAC00) // 588
        return CHOSEONG[choseong_index] if choseong_index < len(CHOSEONG) else 'X'
    if re.match(r'[a-zA-Z]', first_char):
        return first_char.upper()
    return 'X'

def generate_masked_church_id(full_id):
    parts = full_id.rsplit('_', 1)
    name = parts[0]
    channel_id = parts[1] if len(parts) > 1 else ""
    first_alpha = get_first_alphabet(name)
    tail = channel_id[-2:] if len(channel_id) >= 2 else "XX"
    return f"{first_alpha}-{tail}"

BASE_DATA_DIR = "src/data/tfidf"
CHURCH_DIR = os.path.join(BASE_DATA_DIR, "church")
SERMON_DIR = os.path.join(BASE_DATA_DIR, "sermon")

TEMP_DIR = "src/data/tfidf_masked"
os.makedirs(os.path.join(TEMP_DIR, "church"), exist_ok=True)
os.makedirs(os.path.join(TEMP_DIR, "sermon"), exist_ok=True)

print("Mapping churches...")
church_mapping = {}
church_files = [f for f in os.listdir(CHURCH_DIR) if f.endswith('.json')]
for filename in church_files:
    file_path = os.path.join(CHURCH_DIR, filename)
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    original_full_id = data.get('church', filename.replace('.json', ''))
    masked_id = generate_masked_church_id(original_full_id)
    church_mapping[original_full_id] = masked_id
    
    data['church'] = masked_id
    with open(os.path.join(TEMP_DIR, "church", f"{masked_id}.json"), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Processed {len(church_files)} churches.")

print("Processing sermons...")
sermon_folders = [d for d in os.listdir(SERMON_DIR) if os.path.isdir(os.path.join(SERMON_DIR, d))]
total_sermons = 0

for folder in sermon_folders:
    masked_church_id = church_mapping.get(folder, generate_masked_church_id(folder))
    folder_path = os.path.join(SERMON_DIR, folder)
    target_folder = os.path.join(TEMP_DIR, "sermon", masked_church_id)
    os.makedirs(target_folder, exist_ok=True)
    
    sermon_files = sorted([f for f in os.listdir(folder_path) if f.endswith('.json')])
    for idx, filename in enumerate(sermon_files):
        file_path = os.path.join(folder_path, filename)
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except:
                data = {}
        
        masked_sermon_id = f"{masked_church_id}-{idx+1:04d}"
        data['church'] = masked_church_id
        if 'sermon' in data: data['sermon'] = masked_sermon_id
        
        with open(os.path.join(target_folder, f"{masked_sermon_id}.json"), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        total_sermons += 1
        if total_sermons % 500 == 0:
            print(f"Processed {total_sermons} sermons...")

print(f"Total sermons processed: {total_sermons}")

# Replace old data with masked data
print("Swapping directories...")
shutil.rmtree(CHURCH_DIR)
shutil.rmtree(SERMON_DIR)
shutil.move(os.path.join(TEMP_DIR, "church"), CHURCH_DIR)
shutil.move(os.path.join(TEMP_DIR, "sermon"), SERMON_DIR)
shutil.rmtree(TEMP_DIR)

print("Anonymization Finished Successfully.")
