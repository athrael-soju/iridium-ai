import { NextResponse } from 'next/server';
import seed from './seed';

export async function POST(req: Request) {
  // Look into why this only works with parallel uploads = 1 only
  const path = `src/app/api/upload/tmp`;
  const { filename, options } = await req.json();
  try {
    const topK = process.env.PINECONE_TOPK ?? '10';
    console.log('filename', filename);
    const documents = await seed(
      filename,
      path,
      topK,
      process.env.PINECONE_INDEX!,
      options
    );
    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error('Error seeding:', error);
    throw error;
  }
}