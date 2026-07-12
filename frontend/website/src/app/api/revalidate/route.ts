import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const { tag, secret } = await req.json();

    // In a real app, verify the secret matches process.env.REVALIDATION_SECRET
    // if (secret !== process.env.REVALIDATION_SECRET) {
    //   return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    // }

    if (!tag) {
      return NextResponse.json({ message: 'Missing tag param' }, { status: 400 });
    }

    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
