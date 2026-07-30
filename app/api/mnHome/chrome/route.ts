import { NextResponse } from 'next/server';

import { getSessionUser, pushPageHistory } from '@/lib/session';
import { getAppliedItem, getMyBgm, sendMainBar } from '@/lib/db/repo';
import { skinBackgroundColor } from '@/lib/minihome-view';

/**
 * 미니홈피 바깥 프레임(스킨 색 / BGM 플레이리스트 / 하단 롤링 공지 / 이전 방문 홈피)에
 * 필요한 값만 모아서 준다. 탭을 옮겨도 이 값들은 다시 안 받아오므로 BGM 이 끊기지 않는다.
 */
export async function GET(request: Request) {
  const userNickname = new URL(request.url).searchParams.get('userNickname') ?? '';
  const viewer = await getSessionUser();

  if (!userNickname) {
    return NextResponse.json({
      skinColor: skinBackgroundColor(''),
      playList: [],
      notices: [],
      lastPage: null,
      viewerNickname: viewer?.userNickname ?? '',
    });
  }

  // 방문 이력을 쌓고, 직전에 보던 홈피를 돌려받는다 (구 session pageHistory / lastPage)
  const lastPage = await pushPageHistory(userNickname);

  const [skin, playList, notices] = await Promise.all([
    getAppliedItem(userNickname, 'skin'),
    getMyBgm(userNickname),
    sendMainBar(),
  ]);

  return NextResponse.json({
    skinColor: skinBackgroundColor(skin),
    playList: playList.map((b) => ({ title: b.title, contentPath: b.contentPath })),
    notices,
    lastPage,
    viewerNickname: viewer?.userNickname ?? '',
  });
}
