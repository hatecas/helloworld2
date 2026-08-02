import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { insertAlbum } from '@/lib/db/repo';
import { toScope } from '@/lib/db/visibility';
import { isAllowedImage, saveUploadedFile } from '@/lib/upload';

/** 구 AlbumController.albumWrite (multipart: uploadFile[] + contents JSON) */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ userNickname: string }> },
) {
  try {
    const { userNickname: raw } = await params;
    const userNickname = decodeURIComponent(raw);

    const user = await getSessionUser();
    if (!user || user.userNickname !== userNickname) {
      return NextResponse.json({ resultCode: '0' });
    }

    const form = await request.formData();

    const contentsBlob = form.get('contents');
    const contentsText =
      contentsBlob instanceof Blob ? await contentsBlob.text() : String(contentsBlob ?? '{}');
    const contents = JSON.parse(contentsText) as {
      title?: string;
      content?: string;
      visibility?: string;
    };

    if (!contents.title?.trim()) {
      return NextResponse.json({ resultCode: '0' });
    }

    const uploads = form.getAll('uploadFile').filter((f): f is File => f instanceof File);
    if (uploads.length === 0) {
      return NextResponse.json({ resultCode: '0' });
    }

    const filenames: string[] = [];
    for (const file of uploads) {
      if (!isAllowedImage(file.name)) continue;
      filenames.push(await saveUploadedFile(file));
    }
    if (filenames.length === 0) {
      return NextResponse.json({ resultCode: '0' });
    }

    await insertAlbum({
      userNickname,
      title: contents.title,
      content: contents.content ?? '',
      imagePath: filenames.join(','),
      openScope: toScope(contents.visibility),
    });

    return NextResponse.json({ resultCode: '1' });
  } catch (error) {
    console.error('[albumWrite]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
