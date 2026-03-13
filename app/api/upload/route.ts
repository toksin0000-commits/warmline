import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const formData = await request.formData();
  const file = formData.get('audio') as File;
  
  if (!file) {
    return NextResponse.json(
      { error: 'No file uploaded' },
      { status: 400 }
    );
  }

  // Kontrola velikosti (max 5 sekund ~ 500kB)
  if (file.size > 500 * 1024) {
    return NextResponse.json(
      { error: 'File too large' },
      { status: 400 }
    );
  }

  // Nahrání na Vercel Blob (nebo jiné úložiště)
  const blob = await put(`voice/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });

  return NextResponse.json({ url: blob.url });
}