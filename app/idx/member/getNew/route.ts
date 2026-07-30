import { NextResponse } from 'next/server';

import {
  getPendingFriendRequestCount,
  selectNewContentCount,
  selectOnFriends,
  selectVisitCnt,
} from '@/lib/db/repo';

/** 구 MemberController.getNew — home.jsp 가 로그인 후 요약 정보를 받아간다 */
export async function POST(request: Request) {
  try {
    const { userNickname } = (await request.json()) as { userNickname?: string };
    if (!userNickname) {
      return NextResponse.json({
        newContent: 0, newFriend: 0, todayCnt: 0, onFriendCnt: 0, friendList: [],
      });
    }

    const [newContent, newFriend, visitCnt, friendList] = await Promise.all([
      selectNewContentCount(userNickname),
      getPendingFriendRequestCount(userNickname),
      selectVisitCnt(userNickname),
      selectOnFriends(userNickname),
    ]);

    return NextResponse.json({
      newContent,
      newFriend,
      todayCnt: visitCnt?.todayCnt ?? 0,
      onFriendCnt: friendList.length,
      friendList,
    });
  } catch (error) {
    console.error('[getNew]', error);
    return NextResponse.json({
      newContent: 0, newFriend: 0, todayCnt: 0, onFriendCnt: 0, friendList: [],
    });
  }
}
