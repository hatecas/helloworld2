import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { addProfileHistory } from '@/lib/db/repo';
import { isAllowedImage, saveUploadedFile } from '@/lib/upload';
import { sanitizePlainText } from '@/lib/sanitize';

/** 구 ProfileController.uploadFile — 프로필 이미지/문구를 이력으로 쌓는다 */
export async function POST(request: Request) {
  const fail = () => NextResponse.redirect(new URL('/mnhProfileEditFail', request.url), 303);

  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.redirect(new URL('/mnhProfileEditFail?loggedOut=1', request.url), 303);

    const form = await request.formData();
    const fileStatus = String(form.get('fileStatus') ?? 'noFile');
    const msg = String(form.get('msg') ?? '');
    const file = form.get('file');

    let image = 'noneFile';
    if (fileStatus === 'hasFile' && file instanceof File && file.size > 0) {
      if (!isAllowedImage(file.name)) return fail();
      image = await saveUploadedFile(file);
    }

    await addProfileHistory(user.userNickname, image, sanitizePlainText(msg));
    return NextResponse.redirect(new URL('/mnhProfileEditSuccess', request.url), 303);
  } catch (error) {
    console.error('[profile/download]', error);
    return fail();
  }
}
