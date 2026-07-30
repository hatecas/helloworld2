import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { deleteAlbum } from '@/lib/db/repo';
import { getStore } from '@/lib/db/store';

/** 구 AlbumController.albumDelete */
export async function POST(request: Request) {
  try {
    const { seq } = (await request.json()) as { seq?: number | string };
    const seqNum = Number(seq);

    const user = await getSessionUser();
    if (!user || !Number.isFinite(seqNum)) return NextResponse.json({ resultCode: '0' });

    const [album] = await getStore().select('album', { seq: seqNum });
    if (!album || album.userNickname !== user.userNickname) {
      return NextResponse.json({ resultCode: '0' });
    }

    await deleteAlbum(seqNum);
    return NextResponse.json({ resultCode: '1' });
  } catch (error) {
    console.error('[albumDelete]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
