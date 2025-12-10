import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // For now, return the original image as "cleaned"
    // In a full implementation, this would strip EXIF metadata
    const imageBuffer = await image.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="clean_image.png"'
      }
    });
  } catch (error) {
    console.error('Metadata cleaning API error:', error);
    return NextResponse.json(
      { error: 'Failed to clean metadata' },
      { status: 500 }
    );
  }
}