from setuptools import setup, find_packages

setup(
    name="steghider-core",
    version="1.0.0",
    description="Core steganography and encryption library for StegHider",
    packages=find_packages(),
    install_requires=[
        "Pillow>=10.0.0",
        "cryptography>=41.0.0",
        "reedsolo>=1.7.0",
        "qrcode>=7.0.0",
    ],
    python_requires=">=3.8",
)