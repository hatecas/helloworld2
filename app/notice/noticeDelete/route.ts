import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { ADMIN_NICKNAMES, deleteNotice } from '@/lib/db/repo';

/** 구 NoticeController.noticeDelete — 목록/상세 양쪽에서 POST 된다 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !ADMIN_NICKNAMES.includes(user.userNickname)) {
    return NextResponse.redirect(
      new URL(`/notice/noticeView?msg=${encodeURIComponent('권한이 없습니다.')}`, request.url),
      303,
    );
  }

  const form = await request.formData();
  const seqs = form
    .getAll('seq')
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

  const params = new URLSearchParams();
  if (seqs.length === 0) {
    params.set('msg', '삭제할 게시물을 선택해주세요.');
  } else {
    try {
      await deleteNotice(seqs);
      params.set('msg', '삭제되었습니다.');
    } catch (error) {
      console.error('[notice/noticeDelete]', error);
      params.set('msg', '잠시 후 다시 시도해주세요.');
    }
  }

  return NextResponse.redirect(new URL(`/notice/noticeView?${params}`, request.url), 303);
}
