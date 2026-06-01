import json
import os
import re

# --- Constants & Utility Functions (Consistent with anonymize_data.py) ---
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
    # Format: ChurchName_ChannelID
    parts = full_id.rsplit('_', 1)
    name = parts[0]
    channel_id = parts[1] if len(parts) > 1 else ""
    first_alpha = get_first_alphabet(name)
    tail = channel_id[-2:] if len(channel_id) >= 2 else "XX"
    return f"{first_alpha}-{tail}"

def anonymize_topic_map(file_path):
    print(f"Loading {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    total_masked_church = 0
    total_masked_video = 0
    topic_count = 0
    
    # Counter to track numbering for each church globally
    church_counters = {}
    
    # Sort topics to ensure deterministic numbering if possible
    # (though they are already topic_0, topic_1...)
    topic_keys = sorted(data.keys())
    
    for topic_key in topic_keys:
        content = data[topic_key]
        topic_count += 1
        if 'meta' in content:
            for item in content['meta']:
                if 'church' in item:
                    original_church = item['church']
                    # If it's already masked (e.g. S-hw), generate_masked_church_id might not work correctly
                    # unless it handles it. 
                    # Actually, if it contains an underscore, it's original. 
                    # If it's already masked, we keep it as is.
                    if '_' in original_church:
                        masked_church = generate_masked_church_id(original_church)
                        item['church'] = masked_church
                        total_masked_church += 1
                    else:
                        masked_church = original_church
                    
                    # Video ID Masking: MaskedChurchID-0001
                    if masked_church not in church_counters:
                        church_counters[masked_church] = 1
                    
                    masked_video_id = f"{masked_church}-{church_counters[masked_church]:04d}"
                    item['video_id'] = masked_video_id
                    church_counters[masked_church] += 1
                    total_masked_video += 1
        
    print(f"Processed {topic_count} topic entries.")
    print(f"Anonymized {total_masked_church} church references.")
    print(f"Anonymized {total_masked_video} video IDs.")
    
    # Save back
    output_path = file_path # Overwrite original
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully saved masked data to {output_path}")

if __name__ == "__main__":
    TARGET_FILE = "src/data/topicmodel/global_topic_map.json"
    if os.path.exists(TARGET_FILE):
        anonymize_topic_map(TARGET_FILE)
    else:
        print(f"Error: {TARGET_FILE} not found.")
