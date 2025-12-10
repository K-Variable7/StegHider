"""
StegHider Core Library

Core steganography and encryption functions for hiding and revealing messages in images.
"""

from .steg_hider import hide_message, extract_message, metawipe_image, generate_keys

__version__ = "1.0.0"
__all__ = ["hide_message", "extract_message", "metawipe_image", "generate_keys"]
