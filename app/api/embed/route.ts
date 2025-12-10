import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const message = formData.get('message') as string;
    const useEncryption = formData.get('use_encryption') === 'true';
    const password = formData.get('password') as string;

    if (!image || !message) {
      return NextResponse.json(
        { error: 'Image and message are required' },
        { status: 400 }
      );
    }

    // For demo purposes, implement basic steganography
    const imageBuffer = await image.arrayBuffer();
    const modifiedBuffer = await embedMessageInImage(imageBuffer, message, useEncryption, password);

    return new NextResponse(modifiedBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="secret_image.png"'
      }
    });
  } catch (error) {
    console.error('Embed API error:', error);
    return NextResponse.json(
      { error: 'Failed to embed message' },
      { status: 500 }
    );
  }
}

async function embedMessageInImage(imageBuffer: ArrayBuffer, message: string, useEncryption: boolean, password?: string): Promise<ArrayBuffer> {
  // For demo purposes, we'll use a simple approach:
  // Add the message as a base64 encoded string at the end of the image data
  // This is not true steganography but works for demonstration

  let finalMessage = message;
  if (useEncryption && password) {
    // Simple XOR encryption for demo
    finalMessage = xorEncrypt(message, password);
  }

  // Create a marker to identify our embedded data
  const marker = 'STEGHIDE_DEMO_DATA:';
  const encodedMessage = btoa(finalMessage);
  const dataToHide = marker + encodedMessage + '\n';

  // Convert to Uint8Array and append our data
  const originalArray = new Uint8Array(imageBuffer);
  const messageArray = new TextEncoder().encode(dataToHide);

  // Create new array with space for the message
  const resultArray = new Uint8Array(originalArray.length + messageArray.length);
  resultArray.set(originalArray, 0);
  resultArray.set(messageArray, originalArray.length);

  return resultArray.buffer;
}

function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}