#!/usr/bin/env python3

import os
import requests
from pathlib import Path

# Web3.Storage API (sign up at web3.storage for token)
API_TOKEN = os.getenv("WEB3_STORAGE_TOKEN")  # Set your token
if not API_TOKEN:
    print("Set WEB3_STORAGE_TOKEN environment variable")
    exit(1)


def upload_to_web3_storage(file_path):
    url = "https://api.web3.storage/upload"
    headers = {"Authorization": f"Bearer {API_TOKEN}"}
    with open(file_path, "rb") as f:
        response = requests.post(url, headers=headers, files={"file": f})
    if response.status_code == 200:
        return response.json()["cid"]
    else:
        print(f"Upload failed: {response.text}")
        return None


def upload_folder(folder_path):
    cids = {}
    for file in Path(folder_path).glob("*.png"):
        cid = upload_to_web3_storage(file)
        if cid:
            cids[file.name] = f"ipfs://{cid}"
            print(f"Uploaded {file.name}: {cids[file.name]}")
    return cids


if __name__ == "__main__":
    folder = "hunt_clues"
    cids = upload_folder(folder)
    print("CIDs:", cids)
