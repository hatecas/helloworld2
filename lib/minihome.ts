import {
  DEFAULT_PROFILE_IMAGE,
  friendCheck,
  getAppliedItem,
  getHomeOwnerInfo,
  getMyFriends,
  getProfile,
  hasFriendRelation,
  selectVisitCnt,
} from '@/lib/db/repo';
import { canEnterHome, type Viewer } from '@/lib/db/visibility';
import { getSessionUser } from '@/lib/session';
import type { MiniHomeCommon } from '@/lib/minihome-view';

/**
 * 구 미니홈피 컨트롤러들이 모든 화면에서 똑같이 반복하던 조회 블록
 * (프로필 / 주인 정보 / 일촌 목록 / 메뉴 색상 / 방문자 수) 을 한 곳으로 모았다.
 *
 * 색상 헬퍼와 MiniHomeCommon 타입은 클라이언트 컴포넌트에서도 써야 해서
 * lib/minihome-view.ts 로 따로 뺐다.
 */
export type { MiniHomeCommon };

export async function loadMiniHomeCommon(userNickname: string): Promise<MiniHomeCommon | null> {
  const owner = await getHomeOwnerInfo(userNickname);
  if (!owner) return null;

  const viewer = await getSessionUser();
  const isOwner = viewer?.userNickname === userNickname;

  const [profile, friends, menuContentPath, visitCnt, alreadyRelated, friendFlag] =
    await Promise.all([
      getProfile(userNickname),
      getMyFriends(userNickname),
      getAppliedItem(userNickname, 'menu'),
      selectVisitCnt(userNickname),
      viewer && !isOwner
        ? hasFriendRelation(viewer.userNickname, userNickname)
        : Promise.resolve(true),
      // 수락된 일촌인지 (신청중은 아직 일촌이 아니다)
      viewer && !isOwner ? friendCheck(viewer.userNickname, userNickname) : Promise.resolve(1),
    ]);

  const viewerScope: Viewer = { isOwner, isFriend: isOwner || friendFlag === 1 };

  return {
    userNickname,
    viewerNickname: viewer?.userNickname ?? '',
    isOwner,
    viewer: viewerScope,
    canEnter: canEnterHome(owner.homeOpenScope, viewerScope),
    canRequestFriend: Boolean(viewer) && !isOwner && !alreadyRelated,
    todayCnt: visitCnt?.todayCnt ?? 0,
    totalCnt: visitCnt?.totalCnt ?? 0,
    image: profile?.image ?? DEFAULT_PROFILE_IMAGE,
    // 구 컨트롤러가 하던 개행 → <br> 치환
    msg: (profile?.msg ?? '').replace(/\n/g, '<br>'),
    userName: owner.userName,
    userGender: owner.userGender,
    title: owner.title,
    friends,
    menuContentPath,
  };
}
