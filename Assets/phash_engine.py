import sys
from PIL import Image
import imagehash


def generate_phash(image_path):
    try:
        img = Image.open(image_path)
        hash_value = imagehash.phash(img)
        print(f"PHASH_RESULT={hash_value}")
    except Exception as e:
        print(f"PHASH_ERROR={str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("PHASH_ERROR=No image path provided")
        sys.exit(1)
    generate_phash(sys.argv[1])
