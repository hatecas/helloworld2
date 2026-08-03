import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import {
  friendCheck,
  getAlbumContent,
  getBoardContent,
  insertAlbum,
  insertBoard,
} from '@/lib/db/repo';
import { canView } from '@/lib/db/visibility';
import { markScrapHtml, markScrapText } from '@/lib/scrap';
import { sanitizeRichText } from '@/lib/sanitize';

/**
 * 퍼가요 — 일촌의 게시글/사진을 내 미니홈피로 복사한다.
 *
 *   POST { kind: 'board' | 'album', seq }
 *
 * 규칙:
 *  - 일촌(승인된 관계)인 사람의 글만 퍼갈 수 있다. 내 글은 퍼갈 수 없다.
 *  - 원글을 볼 수 있는 자격(공개범위)이 있어야 한다. 못 보는 글은 없는 것처럼 다룬다.
 *  - 공개범위는 원글 것을 그대로 가져온다. 일촌공개 글을 퍼가면서 전체공개로
 *    바꿔 버리면 원글쓴이가 정한 범위를 넘겨 퍼뜨리는 셈이 된다.
 *  - 사진은 파일을 다시 올리지 않고 같은 파일명을 참조한다(업로드 저장소 공용).
 *  - 다이어리는 대상이 아니다.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, msg: '로그인이 필요합니다.' }, { status: 401 });

    const { kind, seq } = (await request.json()) as { kind?: string; seq?: number };
    const seqNum = Number(seq);
    if ((kind !== 'board' && kind !== 'album') || !Number.isFinite(seqNum)) {
      return NextResponse.json({ ok: false, msg: '잘못된 요청입니다.' });
    }

    const source = kind === 'board' ? await getBoardContent(seqNum) : await getAlbumContent(seqNum);
    if (!source || source.del_yn.toUpperCase() === 'Y') {
      return NextResponse.json({ ok: false, msg: '없는 글입니다.' });
    }

    const owner = source.userNickname;
    if (owner === user.userNickname) {
      return NextResponse.json({ ok: false, msg: '내 글은 퍼갈 수 없어요.' });
    }
    if ((await friendCheck(user.userNickname, owner)) !== 1) {
      return NextResponse.json({ ok: false, msg: '일촌의 글만 퍼갈 수 있어요.' });
    }
    if (!canView(source.openScope, { isOwner: false, isFriend: true })) {
      return NextResponse.json({ ok: false, msg: '없는 글입니다.' });
    }

    if (kind === 'board') {
      await insertBoard(
        user.userNickname,
        source.title,
        sanitizeRichText(markScrapHtml(source.content)),
        source.openScope,
      );
    } else {
      await insertAlbum({
        userNickname: user.userNickname,
        title: source.title,
        content: markScrapText(source.content),
        // 같은 업로드 파일을 가리킨다 (파일을 복제하지 않는다)
        imagePath: source.imagePath,
        openScope: source.openScope,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[scrap]', error);
    return NextResponse.json({ ok: false, msg: '잠시 후 다시 시도해주세요.' }, { status: 500 });
  }
}
