import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { ADMIN_NICKNAMES, insertNotice } from '@/lib/db/repo';
import { sanitizeRichText } from '@/lib/sanitize';

/** 구 NoticeController.write */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !ADMIN_NICKNAMES.includes(user.userNickname)) {
    return NextResponse.redirect(
      new URL(`/notice/noticeView?msg=${encodeURIComponent('권한이 없습니다.')}`, request.url),
      303,
    );
  }

  const form = await request.formData();
  const title = String(form.get('title') ?? '').trim();
  const content = String(form.get('content') ?? '');

  const params = new URLSearchParams();
  try {
    if (!title || !content) throw new Error('empty');
    await insertNotice(user.userNickname, title, sanitizeRichText(content));
  } catch (error) {
    console.error('[notice/write]', error);
    params.set('msg', '잠시 후 다시 시도해주세요.');
  }

  return NextResponse.redirect(new URL(`/notice/noticeView?${params}`, request.url), 303);
}
