import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { ADMIN_NICKNAMES, modifyNotice } from '@/lib/db/repo';
import { sanitizeRichText } from '@/lib/sanitize';

/** 구 NoticeController.modify */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !ADMIN_NICKNAMES.includes(user.userNickname)) {
    return NextResponse.redirect(
      new URL(`/notice/noticeView?msg=${encodeURIComponent('권한이 없습니다.')}`, request.url),
      303,
    );
  }

  const form = await request.formData();
  const seq = Number(form.get('seq'));
  const title = String(form.get('title') ?? '').trim();
  const content = String(form.get('content') ?? '').replace(/\r\n/g, '');

  const params = new URLSearchParams({ seq: String(seq) });
  try {
    if (!Number.isFinite(seq)) throw new Error('invalid seq');
    await modifyNotice(seq, title, sanitizeRichText(content));
    params.set('msg', '적용되었습니다 .');
  } catch (error) {
    console.error('[notice/modify]', error);
    params.set('msg', '잠시 후 다시 시도해주세요.');
  }

  return NextResponse.redirect(new URL(`/notice/noticeDetail?${params}`, request.url), 303);
}
