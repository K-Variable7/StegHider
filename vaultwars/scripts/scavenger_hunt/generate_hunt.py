#!/usr/bin/env python3
"""
Scavenger Hunt Generator for StegHider

This script generates a chain of clue images for a scavenger hunt.
Each image hides the next clue, encrypted with a password or RSA keys.

Usage:
    python generate_hunt.py --num_clues 5 --base_images images/ --output hunt_clues/ --password mypassword

Requirements:
    - Base images in a folder
    - steg_hider.py in the same directory
"""

import os
import sys
import random
import argparse
from pathlib import Path
import json

# Add parent directory to path to import steg_hider
sys.path.append(
    os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    )
)
from steghider.core.steg_hider import hide_message, generate_keys


def generate_clue(chain_index, total_clues, theme="vault"):
    """Generate a random clue for the scavenger hunt."""
    clues = [
        f"Look for the next clue in a {theme} image posted on X with hashtag #StegHunt{chain_index + 1}",
        f"The next secret is hidden in a photo of a {random.choice(['castle', 'treasure', 'map', 'key', 'lock'])}",
        f"Search social media for #CipherClue{chain_index + 1} to find the next piece",
        f"Follow the trail to the next image tagged with @StegHiderHunt",
        f"The {chain_index + 1}th clue awaits in a digital vault on Nostr",
        f"Decode this to find the next location: {random.choice(['encrypted', 'hidden', 'buried', 'camouflaged'])} message",
        f"Chain continues at {random.choice(['github.com', 'pastebin.com', 'imgur.com'])}/steg{chain_index + 1}",
        f"Next stop: A {theme} themed image with faction {random.choice(['red', 'blue', 'green', 'gold'])} colors",
    ]

    if chain_index < total_clues - 1:
        clue = random.choice(clues)
    else:
        # Final clue
        clue = f"Congratulations! You've completed the hunt. Claim your reward at: https://steghider.com/reward/{random.randint(1000, 9999)}"

    return clue


def create_hunt_chain(
    num_clues,
    base_images_dir,
    output_dir,
    password=None,
    public_key=None,
    theme="vault",
    players=20,
    factions=4,
    difficulty_start=1,
):
    """Create a chain of clue images."""

    # Get list of base images
    base_images = list(Path(base_images_dir).glob("*.png")) + list(
        Path(base_images_dir).glob("*.jpg")
    )
    if not base_images:
        print(f"No images found in {base_images_dir}")
        return

    print(f"Found {len(base_images)} base images")

    # Create output directory
    Path(output_dir).mkdir(exist_ok=True)

    # Generate keys if using premium encryption
    if not password and not public_key:
        print("No encryption specified, using basic level")
        level = "basic"
    elif password:
        level = "advanced"
        print("Using password encryption")
    else:
        level = "premium"
        print("Using RSA encryption")

    if level == "premium" and not public_key:
        # Generate keys
        generate_keys("scavenger_private.pem", "scavenger_public.pem")
        public_key = "scavenger_public.pem"

    chain_info = []

    for i in range(num_clues):
        # Select random base image
        base_image = random.choice(base_images)

        # Generate clue
        clue = generate_clue(i, num_clues, theme)

        # Output path
        output_path = Path(output_dir) / f"clue_{i + 1}.png"

        print(f"Creating clue {i + 1}/{num_clues}: {clue[:50]}...")

        # Embed the clue
        try:
            # Calculate appropriate RS symbols based on message length
            message_length = len(clue.encode("utf-8"))
            if message_length < 256:
                rs_symbols = max(
                    1, message_length // 4
                )  # Use 1/4 of message length, minimum 1
                expected_corr = 5  # Lower corruption expectation
            else:
                rs_symbols = 255
                expected_corr = 10

            result = hide_message(
                image_path=str(base_image),
                secret_message=clue,
                output_path=str(output_path),
                password=password,
                public_key_path=public_key,
                level=level,
                enable_rs=True,  # Enable robustness for sharing
                auto_tune=False,  # Disable auto-tune to use our parameters
                expected_corruption=expected_corr,
                nsym=rs_symbols,
            )

            chain_info.append(
                {
                    "clue_number": i + 1,
                    "clue_text": clue,
                    "image_path": str(output_path),
                    "base_image": str(base_image),
                    "encryption_level": level,
                }
            )

        except Exception as e:
            print(f"Error creating clue {i + 1}: {e}")
            continue

    # Save chain information
    with open(Path(output_dir) / "hunt_info.json", "w") as f:
        json.dump(chain_info, f, indent=2)

    print(f"\nHunt chain created in {output_dir}")
    print("Starting image:", chain_info[0]["image_path"])
    print("Hunt info saved to hunt_info.json")

    return chain_info


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate StegHider Scavenger Hunt")
    parser.add_argument(
        "--num_clues", type=int, default=5, help="Number of clues in the chain"
    )
    parser.add_argument(
        "--base_images", default="images", help="Directory with base images"
    )
    parser.add_argument(
        "--output", default="hunt_clues", help="Output directory for clues"
    )
    parser.add_argument("--password", help="Password for encryption (advanced level)")
    parser.add_argument("--public_key", help="Path to RSA public key (premium level)")
    parser.add_argument(
        "--players", type=int, default=20, help="Number of players for the hunt"
    )
    parser.add_argument("--factions", type=int, default=4, help="Number of factions")
    parser.add_argument(
        "--difficulty-start", type=int, default=1, help="Starting difficulty level"
    )
    parser.add_argument("--theme", default="vault", help="Theme for the hunt clues")

    args = parser.parse_args()

    create_hunt_chain(
        num_clues=args.num_clues,
        base_images_dir=args.base_images,
        output_dir=args.output,
        password=args.password,
        public_key=args.public_key,
        theme=args.theme,
        players=args.players,
        factions=args.factions,
        difficulty_start=args.difficulty_start,
    )
