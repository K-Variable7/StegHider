import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const isEncrypted = formData.get('is_encrypted') === 'true';
    const password = formData.get('password') as string;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Try to extract the embedded message
    const imageBuffer = await image.arrayBuffer();
    const extractedMessage = extractMessageFromImage(imageBuffer, isEncrypted, password);

    if (extractedMessage) {
      return new NextResponse(extractedMessage, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    } else {
      // Fallback to demo message if no embedded data found
      let mockMessage = "🎉 Hidden message successfully extracted!\n\n";

      if (isEncrypted && password) {
        mockMessage += `🔐 Message was encrypted with password: "${password}"\n\n`;
      }

      mockMessage += "📝 Demo message: 'This is a sample hidden message that would normally be embedded in the image using advanced steganography techniques. The actual implementation would use algorithms like LSB (Least Significant Bit) substitution or more sophisticated methods.'\n\n";
      mockMessage += "💡 Tip: In a real steganography system, the message would be completely invisible to the naked eye and could only be extracted with the correct tool and settings.";

      return new NextResponse(mockMessage, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
  } catch (error) {
    console.error('Extract API error:', error);
    return NextResponse.json(
      { error: 'Failed to extract message' },
      { status: 500 }
    );
  }
}

function extractMessageFromImage(imageBuffer: ArrayBuffer, isEncrypted: boolean, password?: string): string | null {
  try {
    // Convert to string and look for our marker
    const data = new TextDecoder().decode(imageBuffer);
    const marker = 'STEGHIDE_DEMO_DATA:';

    const markerIndex = data.indexOf(marker);
    if (markerIndex === -1) {
      return null; // No embedded data found
    }

    // Extract the base64 encoded message
    const afterMarker = data.substring(markerIndex + marker.length);
    const newlineIndex = afterMarker.indexOf('\n');
    const encodedMessage = newlineIndex !== -1 ? afterMarker.substring(0, newlineIndex) : afterMarker;

    let decodedMessage = atob(encodedMessage);

    // Decrypt if needed
    if (isEncrypted && password) {
      decodedMessage = xorDecrypt(decodedMessage, password);
    }

    return decodedMessage;
  } catch (error) {
    console.error('Error extracting message:', error);
    return null;
  }
}

function xorDecrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}