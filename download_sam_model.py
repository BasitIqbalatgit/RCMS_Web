import os
import urllib.request
from pathlib import Path

def download_file(url: str, destination: str):
    """Download a file from a URL to a destination path"""
    print(f"Downloading {url} to {destination}...")
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    urllib.request.urlretrieve(url, destination)
    print(f"Downloaded to {destination}")

def main():
    # Create models directory if it doesn't exist
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)

    # SAM model URLs
    model_urls = {
        "sam_vit_h": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth",
        "sam_vit_l": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth",
        "sam_vit_b": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"
    }

    # Download the smallest model (vit_b) by default
    model_name = "sam_vit_b"
    model_url = model_urls[model_name]
    model_path = models_dir / f"{model_name}.pth"

    if not model_path.exists():
        download_file(model_url, str(model_path))
    else:
        print(f"Model already exists at {model_path}")

if __name__ == "__main__":
    main() 