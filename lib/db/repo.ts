import { getStore, type Table } from './store';
import { nowIso, todayYmd, withinHours, ymd, ymdDot, ymdhm, ymdhmDot } from './format';
import type {
  Album, Board, BoardComment, Diary, DiaryComment, Friend, FriendStatus,
  Notice, StorageCategory, StoreItem, User, Visit,
} from './types';

/**
 * 구 DAO/Service 계층(com.core.tjoeun.**.dao / **.service)이 하던 일을
 * 그대로 옮긴 도메인 함수 모음. MyBatis 매퍼 XML 의 각 쿼리와 1:1 로 대응한다.
 */

const db = () => getStore();

const PAGE_SIZE = 10;
const VISIT_PAGE_SIZE = 5;

export const DEFAULT_MINIMI_PATH = '/resources/images/default/defaultMinimiIcon.gif';
export const DEFAULT_BACKGROUND_PATH = '/resources/images/default/defaultBg.jpg';
export const DEFAULT_SKIN_COLOR = 'rgb(42, 140, 168)';
export const DEFAULT_PROFILE_IMAGE = 'defaultProfile.png';

/** NoticeController 가 하드코딩하고 있던 관리자 닉네임 */
export const ADMIN_NICKNAMES = ['제인', '관리자'];

function desc<T>(rows: T[], key: (row: T) => string | number): T[] {
  return [...rows].sort((a, b) => {
    const x = key(a);
    const y = key(b);
    return x < y ? 1 : x > y ? -1 : 0;
  });
}

/* ================================================================== */
/* 회원 (MemberMapper)                                                 */
/* ================================================================== */

export async function selectUserInfo(match: {
  userEmail?: string;
  userPassword?: string;
  userPhone?: string;
  userNickname?: string;
}): Promise<(User & { currentDotori: number; createDate: string }) | null> {
  // 지정된 조건만 골라 DB 로 내려보낸다 (전부 비면 첫 행이 아니라 null 을 준다)
  const filter: Partial<User> = {};
  if (match.userEmail != null) filter.userEmail = match.userEmail;
  if (match.userPassword != null) filter.userPassword = match.userPassword;
  if (match.userPhone != null) filter.userPhone = match.userPhone;
  if (match.userNickname != null) filter.userNickname = match.userNickname;
  if (Object.keys(filter).length === 0) return null;

  const found = (await db().select('user', filter))[0];
  if (!found) return null;

  const dotori = (await db().select('dotori', { userNickname: found.userNickname }))[0];
  return {
    ...found,
    createDate: ymdDot(found.createDate),
    currentDotori: dotori?.currentDotori ?? 0,
  };
}

/** selectUserId: 이름 + 전화번호(+ 아이디)로 이메일 찾기 */
export async function selectUserId(params: {
  userName: string;
  userPhone: string;
  userId?: string;
}): Promise<{ userEmail: string } | null> {
  const users = await db().select('user');
  const found = users.find(
    (u) =>
      u.userName === params.userName &&
      u.userPhone === params.userPhone &&
      (!params.userId || u.userEmail === params.userId),
  );
  return found ? { userEmail: found.userEmail } : null;
}

export async function updatePw(userId: string, newPwHash: string): Promise<number> {
  return db().update('user', { userEmail: userId }, { userPassword: newPwHash });
}

export async function selectUserMinimi(userNickname: string): Promise<string | null> {
  const rows = await db().select('userStorage', {
    userNickname,
    category: 'minimi',
    allocation: 1,
  });
  return rows[0]?.contentPath ?? null;
}

export async function selectUserName(userNickname: string): Promise<string | null> {
  const rows = await db().select('user', { userNickname });
  return rows[0]?.userName ?? null;
}

export async function selectUserGender(userNickname: string): Promise<string | null> {
  const rows = await db().select('user', { userNickname });
  return rows[0]?.userGender ?? null;
}

export async function loginOnStatus(userNickname: string) {
  const existing = await db().select('loginStatus', { userNickname });
  if (existing.length === 0) {
    await db().insert('loginStatus', { userNickname, status: '1' });
  } else {
    await db().update('loginStatus', { userNickname }, { status: '1' });
  }
}

export async function loginOffStatus(userNickname: string) {
  await db().update('loginStatus', { userNickname }, { status: '0' });
}

export async function insertLoginLog(userNickname: string) {
  await db().insert('loginLog', { userNickname, logDate: nowIso() });
}

/** 회원가입: 구 MemberServiceImpl.signUp 이 하던 부속 INSERT 를 전부 재현 */
export async function signUp(params: {
  userEmail: string;
  userPassword: string; // 이미 SHA-256 처리된 값
  userName: string;
  userNickname: string;
  userGender: 'M' | 'F';
  userBirth: string;
  userPhone: string;
}): Promise<void> {
  const s = db();
  const now = nowIso();

  await s.insert('user', {
    ...params,
    createDate: now,
    userAvailable: 'Y',
  });

  await s.insert('dotori', { userNickname: params.userNickname, currentDotori: 100 });
  await s.insert('dotoriC', {
    userNickname: params.userNickname,
    dotoriCharge: 100,
    dotoriChargeDate: now,
    dotoriChargeMethod: '회원가입 축하 포인트',
    dotoriPrice: '0',
  });
  await s.insert('miniroomBackground', {
    userNickname: params.userNickname,
    backgroundName: 'defaultBg',
    backgroundPath: DEFAULT_BACKGROUND_PATH,
  });
  await s.insert('miniroomMinimi', {
    userNickname: params.userNickname,
    minimiName: 'defaultMinimiIcon',
    minimiPath: DEFAULT_MINIMI_PATH,
    minimiLeft: '390px',
    minimiTop: '163px',
  });
  await s.insert('miniHomeTitle', {
    userNickname: params.userNickname,
    title: '저의 미니홈에 방문하신것을 환영합니다.',
    update_date: now,
  });
  await s.insert('profile', {
    userNickname: params.userNickname,
    image: DEFAULT_PROFILE_IMAGE,
    msg: 'HelloWorld에 가입하신것을 축하드립니다.',
    create_date: now,
    update_date: now,
  });
  await s.insert('userStorage', {
    userNickname: params.userNickname, category: 'minimi',
    productName: '기본 미니미', contentPath: DEFAULT_MINIMI_PATH,
    buy_date: now, allocation: 1,
  });
  await s.insert('userStorage', {
    userNickname: params.userNickname, category: 'skin',
    productName: '기본 스킨', contentPath: DEFAULT_SKIN_COLOR,
    buy_date: now, allocation: 1,
  });
  await s.insert('userStorage', {
    userNickname: params.userNickname, category: 'menu',
    productName: '기본 메뉴', contentPath: DEFAULT_SKIN_COLOR,
    buy_date: now, allocation: 1,
  });
  await s.insert('loginStatus', { userNickname: params.userNickname, status: '0' });
  await s.insert('visitCnt', { userNickname: params.userNickname, todayCnt: 0, totalCnt: 0 });
}

/** 나와 얽힌 일촌 관계만 가져온다 (신청한 쪽 / 신청받은 쪽 둘 다) */
async function myFriendRows(userNickname: string) {
  const rows = await db().selectOr('friends', [{ userNickname }, { friendNickname: userNickname }]);
  return rows.filter((f) => f.del_yn.toUpperCase() !== 'Y');
}

/** 관계에서 상대방 닉네임을 꺼낸다 */
function otherSide(row: Friend, me: string): string | null {
  if (row.userNickname === me) return row.friendNickname;
  if (row.friendNickname === me) return row.userNickname;
  return null;
}

/** 접속중인 일촌 목록 (selectOnFriendCnt) */
export async function selectOnFriends(userNickname: string): Promise<string[]> {
  const accepted = (await myFriendRows(userNickname)).filter((f) => f.fStatus === 1);
  const nicknames = [...new Set(accepted.map((f) => otherSide(f, userNickname)).filter(Boolean))] as string[];
  if (nicknames.length === 0) return [];

  const statuses = await db().selectIn('loginStatus', 'userNickname', nicknames);
  const online = new Set(statuses.filter((s) => s.status === '1').map((s) => s.userNickname));
  return nicknames.filter((n) => online.has(n));
}

/** 나에게 들어온 대기중 일촌 신청 수 (getFriendCount) */
export async function getPendingFriendRequestCount(userNickname: string): Promise<number> {
  const rows = await db().select('friends', { friendNickname: userNickname, fStatus: 0 });
  return rows.filter((f) => f.del_yn.toUpperCase() !== 'Y').length;
}

/** 최근 24시간 내 새 컨텐츠 수 (selectNewContent) */
export async function selectNewContentCount(userNickname: string): Promise<number> {
  const t = await tabs(userNickname);
  return t.RecentDiaryCount + t.RecentBoardCount + t.RecentAlbumCount + t.RecentVisitCount;
}

/* ================================================================== */
/* 미니홈피 메인 (MainMapper)                                          */
/* ================================================================== */

export async function getMyBgm(userNickname: string) {
  return db().select('userBgm', { userNickname, allocation: 1 });
}

export async function selectVisitCnt(userNickname: string) {
  const rows = await db().select('visitCnt', { userNickname });
  return rows[0] ?? null;
}

/** 방문할 때마다 today/total 을 1씩 올린다 (MainServiceImpl.updateVisitCnt) */
export async function updateVisitCnt(
  userNickname: string,
): Promise<{ todayCnt: number; totalCnt: number }> {
  const current = await selectVisitCnt(userNickname);
  if (!current) {
    await db().insert('visitCnt', { userNickname, todayCnt: 1, totalCnt: 1 });
    return { todayCnt: 1, totalCnt: 1 };
  }
  const todayCnt = current.todayCnt + 1;
  const totalCnt = current.totalCnt + 1;
  await db().update('visitCnt', { userNickname }, { todayCnt, totalCnt });
  return { todayCnt, totalCnt };
}

/**
 * 프로필(이미지 + 상태메시지).
 * 구 MainServiceImpl 은 image 가 'noneFile' 이거나 msg 가 비어 있으면
 * 이전 이력에서 값을 끌어왔다. 그 결과만 동일하게 재현한다.
 */
export async function getProfile(
  userNickname: string,
): Promise<{ image: string; msg: string } | null> {
  const rows = desc(await db().select('profile', { userNickname }), (p) => p.create_date);
  if (rows.length === 0) return null;

  const image = rows.find((p) => p.image && p.image !== 'noneFile')?.image ?? DEFAULT_PROFILE_IMAGE;
  const msg = rows.find((p) => p.msg && p.msg !== '')?.msg ?? '';
  return { image, msg };
}

export async function getProfileHistory(userNickname: string) {
  return desc(await db().select('profile', { userNickname }), (p) => p.create_date).map((p) => ({
    ...p,
    create_date: ymdhm(p.create_date),
  }));
}

export async function addProfileHistory(userNickname: string, image: string, msg: string) {
  const now = nowIso();
  await db().insert('profile', {
    userNickname, image, msg, create_date: now, update_date: now,
  });
}

/** selectUserInfo: 홈피 주인의 이름/성별/제목 */
export async function getHomeOwnerInfo(userNickname: string): Promise<{
  seq: number | null;
  title: string;
  userGender: string;
  userName: string;
} | null> {
  const user = (await db().select('user', { userNickname }))[0];
  if (!user) return null;
  const titleRow = (await db().select('miniHomeTitle', { userNickname }))[0];
  return {
    seq: titleRow?.seq ?? null,
    title: titleRow?.title ?? `${user.userName}의 미니홈피입니다.`,
    userGender: user.userGender,
    userName: user.userName,
  };
}

/** getMyFriends: 승인된 일촌 목록 (파도타기 드롭다운용) */
export async function getMyFriends(
  userNickname: string,
): Promise<Array<{ Name: string; userEmail: string }>> {
  const accepted = (await myFriendRows(userNickname)).filter((f) => f.fStatus === 1);
  const nicknames = [...new Set(accepted.map((f) => otherSide(f, userNickname)).filter(Boolean))] as string[];
  if (nicknames.length === 0) return [];

  const users = await db().selectIn('user', 'userNickname', nicknames);
  const emailOf = new Map(users.map((u) => [u.userNickname, u.userEmail]));

  return nicknames
    .filter((n) => emailOf.has(n))
    .map((n) => ({ Name: n, userEmail: emailOf.get(n)! }));
}

/** friendCheck: 두 사람이 일촌인지 (1/0) */
export async function friendCheck(userNickname: string, friendNickname: string): Promise<number> {
  if (!friendNickname) return 0;
  const rows = await db().selectOr('friends', [
    { userNickname, friendNickname, fStatus: 1 },
    { userNickname: friendNickname, friendNickname: userNickname, fStatus: 1 },
  ]);
  return rows.length > 0 ? 1 : 0;
}

export interface Tabs {
  TotalDiaryCount: number;
  RecentDiaryCount: number;
  TotalBoardCount: number;
  RecentBoardCount: number;
  TotalAlbumCount: number;
  RecentAlbumCount: number;
  TotalVisitCount: number;
  RecentVisitCount: number;
}

export async function tabs(userNickname: string): Promise<Tabs> {
  const [diaries, boards, albums, visits] = await Promise.all([
    db().select('diary', { userNickname }),
    db().select('board', { userNickname }),
    db().select('album', { userNickname }),
    db().select('visit', { targetNickname: userNickname }),
  ]);
  const alive = <T extends { del_yn: string }>(rows: T[]) =>
    rows.filter((r) => r.del_yn.toLowerCase() === 'n');
  const recent = <T extends { update_date: string }>(rows: T[]) =>
    rows.filter((r) => withinHours(r.update_date, 24)).length;

  return {
    TotalDiaryCount: alive(diaries).length,
    RecentDiaryCount: recent(alive(diaries)),
    TotalBoardCount: alive(boards).length,
    RecentBoardCount: recent(alive(boards)),
    TotalAlbumCount: alive(albums).length,
    RecentAlbumCount: recent(alive(albums)),
    TotalVisitCount: visits.length,
    RecentVisitCount: recent(visits),
  };
}

/** selectCurrentContent: 게시판/사진첩 최신 4건 */
export async function selectCurrentContent(userNickname: string) {
  const [boards, albums] = await Promise.all([
    db().select('board', { userNickname }),
    db().select('album', { userNickname }),
  ]);
  const rows = [
    ...boards
      .filter((b) => b.del_yn.toUpperCase() === 'N' && b.openScope === 1)
      .map((b) => ({ seq: b.seq, title: b.title, tableName: 'board', update_date: b.update_date })),
    ...albums
      .filter((a) => a.del_yn.toUpperCase() === 'N' && a.openScope === 1)
      .map((a) => ({ seq: a.seq, title: a.title, tableName: 'album', update_date: a.update_date })),
  ];
  return desc(rows, (r) => r.update_date).slice(0, 4);
}

/** getMinimi: 미니룸 편집창에서 배치할 수 있는 보유 미니미 */
export async function getOwnedMinimi(userNickname: string) {
  return db().select('userStorage', { userNickname, category: 'minimi' });
}

export async function selectMiniroomMinimi(userNickname: string) {
  return db().select('miniroomMinimi', { userNickname });
}

export async function selectMiniroomBackground(userNickname: string) {
  const rows = await db().select('miniroomBackground', { userNickname });
  return rows[0] ?? { userNickname, backgroundName: 'defaultBg', backgroundPath: DEFAULT_BACKGROUND_PATH };
}

export async function saveMiniroom(
  userNickname: string,
  backgroundName: string,
  minimis: Array<{ minimiName: string; minimiLeft: string; minimiTop: string }>,
) {
  await db().remove('miniroomBackground', { userNickname });
  await db().insert('miniroomBackground', {
    userNickname,
    backgroundName,
    backgroundPath: `/resources/images/miniroom/${backgroundName}.png`,
  });

  await db().remove('miniroomMinimi', { userNickname });
  for (const m of minimis) {
    await db().insert('miniroomMinimi', {
      userNickname,
      minimiName: m.minimiName,
      minimiPath: `/resources/images/minimi/${m.minimiName}.gif`,
      minimiLeft: m.minimiLeft,
      minimiTop: m.minimiTop,
    });
  }
}

export async function selectHomeTitle(userNickname: string) {
  const rows = await db().select('miniHomeTitle', { userNickname });
  return rows[0] ?? null;
}

export async function updateHomeTitle(userNickname: string, title: string) {
  const existing = await selectHomeTitle(userNickname);
  if (existing) {
    await db().update('miniHomeTitle', { userNickname }, { title, update_date: nowIso() });
  } else {
    await db().insert('miniHomeTitle', { userNickname, title, update_date: nowIso() });
  }
}

/** mainSkin / mainMenu: 현재 적용중인 스킨·메뉴 색상 */
export async function getAppliedItem(
  userNickname: string,
  category: StorageCategory,
): Promise<string> {
  const rows = await db().select('userStorage', { userNickname, category, allocation: 1 });
  return rows[0]?.contentPath ?? DEFAULT_SKIN_COLOR;
}

export async function insertFriendCmt(
  userNickname: string,
  friendNickname: string,
  content: string,
) {
  await db().insert('friendCMT', {
    userNickname, friendNickname, content, createDate: nowIso(), del_yn: 'n',
  });
}

/** selectFriendCmt: 일촌평 최근 5개 */
export async function selectFriendCmt(friendNickname: string) {
  const rows = await db().select('friendCMT', { friendNickname });
  return desc(
    rows.filter((r) => r.del_yn.toLowerCase() === 'n'),
    (r) => r.createDate,
  )
    .slice(0, 5)
    .map((r) => ({
      userNickname: r.userNickname,
      friendNickname: r.friendNickname,
      content: r.content,
      createDate: ymdhm(r.createDate),
    }));
}

/* ================================================================== */
/* 상점 (StoreMapper)                                                  */
/* ================================================================== */

export async function getBgmList(filter?: {
  content?: string;
  title?: string;
  artist?: string;
}) {
  let rows = await db().select('bgm');
  if (filter?.title && filter?.artist) {
    rows = rows.filter((b) => b.title === filter.title && b.artist === filter.artist);
  } else if (filter?.content) {
    const q = filter.content.toLowerCase();
    rows = rows.filter(
      (b) => b.title.toLowerCase().includes(q) || b.artist.toLowerCase().includes(q),
    );
  }
  return rows;
}

export async function getStoreItems(category: StorageCategory, page = 1): Promise<StoreItem[]> {
  const rows = (await db().select('store', { category })).filter(
    (s) => s.productName !== '기본 미니미',
  );
  const offset = PAGE_SIZE * (page - 1);
  return rows.slice(offset, offset + PAGE_SIZE);
}

/** selectStoreCnt: 전체 페이지 수 */
export async function getStorePageCount(category: StorageCategory): Promise<number> {
  const rows = (await db().select('store', { category })).filter(
    (s) => s.productName !== '기본 미니미',
  );
  return Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
}

export async function getMyDotori(userNickname: string): Promise<number> {
  const rows = await db().select('dotori', { userNickname });
  return rows[0]?.currentDotori ?? 0;
}

export async function setDotori(userNickname: string, amount: number) {
  const rows = await db().select('dotori', { userNickname });
  if (rows.length === 0) {
    await db().insert('dotori', { userNickname, currentDotori: amount });
  } else {
    await db().update('dotori', { userNickname }, { currentDotori: amount });
  }
}

export async function chargeDotori(params: {
  userNickname: string;
  dotoriCharge: number;
  dotoriMethod: string;
  dotoriPrice: string;
}): Promise<number> {
  await db().insert('dotoriC', {
    userNickname: params.userNickname,
    dotoriCharge: params.dotoriCharge,
    dotoriChargeDate: nowIso(),
    dotoriChargeMethod: params.dotoriMethod,
    dotoriPrice: params.dotoriPrice,
  });
  const current = await getMyDotori(params.userNickname);
  const next = current + params.dotoriCharge;
  await setDotori(params.userNickname, next);
  return next;
}

export async function insertDotoriUse(userNickname: string, dotoriUse: number, dotoriUseFor: string) {
  await db().insert('dotoriU', {
    userNickname, dotoriUse, dotoriUseFor, dotoriUseDate: nowIso(),
  });
}

export async function selectDotoriUse(userNickname: string) {
  const rows = desc(await db().select('dotoriU', { userNickname }), (r) => r.dotoriUseDate);
  return rows.map((r) => {
    // "미니미 구매-스타 픽시" 를 카테고리/상세로 쪼개던 SettingController 로직
    const [category, detail] = r.dotoriUseFor.split('구매-');
    return {
      ...r,
      formattedDotoriUseDate: ymdhmDot(r.dotoriUseDate),
      category: detail != null ? category.trim() : r.dotoriUseFor,
      detail: detail != null ? detail.trim() : '',
    };
  });
}

export async function selectDotoriCharge(userNickname: string) {
  const rows = desc(await db().select('dotoriC', { userNickname }), (r) => r.dotoriChargeDate);
  return rows.map((r) => ({
    ...r,
    formattedDotoriChargeDate: ymdhmDot(r.dotoriChargeDate),
  }));
}

export async function hasStorageItem(
  userNickname: string,
  category: StorageCategory,
  productName: string,
): Promise<boolean> {
  const rows = await db().select('userStorage', { userNickname, category, productName });
  return rows.length > 0;
}

export async function insertBuyCart(params: {
  userNickname: string;
  category: StorageCategory;
  productName: string;
  contentPath: string;
}) {
  await db().insert('userStorage', { ...params, buy_date: nowIso(), allocation: 0 });
}

export async function putBgm(params: {
  userNickname: string;
  title: string;
  artist: string;
  runningTime: string;
  contentPath: string;
  bgmPrice: string;
}) {
  await insertDotoriUse(
    params.userNickname,
    Number(params.bgmPrice) || 0,
    `bgm 구매-${params.title}`,
  );
  await db().insert('userBgm', {
    userNickname: params.userNickname,
    title: params.title,
    artist: params.artist,
    runningTime: params.runningTime,
    contentPath: params.contentPath,
    allocation: 0,
  });
}

/* ================================================================== */
/* 설정 (SettingMapper)                                                */
/* ================================================================== */

export async function selectUserStorage(userNickname: string, category: StorageCategory) {
  return db().select('userStorage', { userNickname, category });
}

/** updateAllocationOff + updateAllocationOn: 적용 아이템 교체 */
export async function applyStorageItem(
  userNickname: string,
  category: StorageCategory,
  productName: string,
): Promise<{ contentPath: string; productName: string } | null> {
  await db().update('userStorage', { userNickname, category, allocation: 1 }, { allocation: 0 });
  await db().update('userStorage', { userNickname, category, productName }, { allocation: 1 });
  const applied = (await db().select('userStorage', { userNickname, category, allocation: 1 }))[0];
  return applied ? { contentPath: applied.contentPath, productName: applied.productName } : null;
}

export async function searchUser(userNickname: string) {
  const rows = await db().select('user', { userNickname });
  if (rows.length === 0) return null;
  const u = rows[0];
  return {
    userEmail: u.userEmail,
    userName: u.userName,
    userNickname: u.userNickname,
    userPhone: u.userPhone,
    createDate: ymdDot(u.createDate),
  };
}

/** insertFriendRequest: 이미 관계가 있으면 -1 */
export async function insertFriendRequest(
  requestUser: string,
  responseUser: string,
): Promise<number> {
  if (!requestUser || !responseUser || requestUser === responseUser) return -1;
  const existing = await db().selectOr('friends', [
    { userNickname: requestUser, friendNickname: responseUser },
    { userNickname: responseUser, friendNickname: requestUser },
  ]);
  if (existing.some((f) => f.del_yn.toUpperCase() !== 'Y')) return -1;

  await db().insert('friends', {
    userNickname: requestUser,
    friendNickname: responseUser,
    del_yn: 'N',
    fStatus: 0,
    createDate: nowIso(),
  });
  return 1;
}

export interface FriendRow {
  seq: number;
  userNickname: string;
  friendNickname: string;
  fStatus: FriendStatus;
  createDate: string;
  userName: string;
}

/** selectFriends: 나와 얽힌 일촌 관계 전부 (상대방 이름 포함) */
export async function selectFriends(
  userNickname: string,
  nameFilter?: string,
): Promise<FriendRow[]> {
  const rows = (await myFriendRows(userNickname)).filter(
    (f) =>
      !nameFilter ||
      f.userNickname.includes(nameFilter) ||
      f.friendNickname.includes(nameFilter),
  );
  if (rows.length === 0) return [];

  const others = [...new Set(rows.map((f) => otherSide(f, userNickname)).filter(Boolean))] as string[];
  const users = await db().selectIn('user', 'userNickname', others);
  const nameOf = new Map(users.map((u) => [u.userNickname, u.userName]));

  return rows.map((f) => {
    const other = otherSide(f, userNickname) ?? f.friendNickname;
    return {
      seq: f.seq,
      userNickname: f.userNickname,
      friendNickname: f.friendNickname,
      fStatus: f.fStatus,
      createDate: ymd(f.createDate),
      userName: nameOf.get(other) ?? other,
    };
  });
}

export async function updateFriendStatus(
  seq: number,
  patch: { fStatus?: FriendStatus; del?: 'Y' | 'N' },
): Promise<number> {
  const change: Partial<Friend> = {};
  if (patch.fStatus != null) change.fStatus = patch.fStatus;
  if (patch.del != null) change.del_yn = patch.del;
  if (Object.keys(change).length === 0) return 0;
  return db().update('friends', { seq }, change);
}

export async function changeName(
  userNickname: string,
  originalName: string,
  changedName: string,
): Promise<number> {
  const rows = await db().select('user', { userNickname, userName: originalName });
  if (rows.length === 0) return 0;
  return db().update('user', { userNickname }, { userName: changedName });
}

/** 닉네임 변경. 중복이면 3 (구 코드가 Duplicate 예외를 3 으로 매핑했다) */
export async function changeNickname(
  userEmail: string,
  originalNickname: string,
  changedNickname: string,
): Promise<number> {
  if (!changedNickname) return 0;
  if ((await db().select('user', { userNickname: changedNickname })).length > 0) return 3;

  const target = (await db().select('user', {
    userEmail,
    userNickname: originalNickname,
  }))[0];
  if (!target) return 0;

  await db().update('user', { userEmail }, { userNickname: changedNickname });

  // 닉네임을 참조하던 테이블들을 함께 갱신 (구 스키마의 ON UPDATE CASCADE 대체)
  const cascade: Array<[Table, string]> = [
    ['dotori', 'userNickname'], ['dotoriC', 'userNickname'], ['dotoriU', 'userNickname'],
    ['userStorage', 'userNickname'], ['userBgm', 'userNickname'], ['profile', 'userNickname'],
    ['miniHomeTitle', 'userNickname'], ['miniroomBackground', 'userNickname'],
    ['miniroomMinimi', 'userNickname'], ['board', 'userNickname'], ['boardCMT', 'userNickname'],
    ['diary', 'userNickname'], ['diaryCMT', 'userNickname'], ['album', 'userNickname'],
    ['visit', 'userNickname'], ['visit', 'targetNickname'], ['visitCnt', 'userNickname'],
    ['friends', 'userNickname'], ['friends', 'friendNickname'],
    ['friendCMT', 'userNickname'], ['friendCMT', 'friendNickname'],
    ['loginStatus', 'userNickname'], ['loginLog', 'userNickname'],
  ];
  for (const [table, column] of cascade) {
    await db().update(
      table,
      { [column]: originalNickname } as never,
      { [column]: changedNickname } as never,
    );
  }
  return 1;
}

export async function changeNumber(
  userNickname: string,
  originalNumber: string,
  changedNumber: string,
): Promise<number> {
  const takenBy = await db().select('user', { userPhone: changedNumber });
  if (takenBy.some((u) => u.userNickname !== userNickname)) return 3;

  const rows = await db().select('user', { userNickname, userPhone: originalNumber });
  if (rows.length === 0) return 0;
  return db().update('user', { userNickname }, { userPhone: changedNumber });
}

export async function selectPhone(userNickname: string): Promise<string> {
  const rows = await db().select('user', { userNickname });
  return rows[0]?.userPhone ?? '';
}

export async function selectMyBgm(userNickname: string, onlyAllocated = false) {
  const rows = await db().select('userBgm', { userNickname });
  return onlyAllocated ? rows.filter((b) => b.allocation === 1) : rows;
}

export async function setPlayList(
  userNickname: string,
  titles: string[],
  allocation: 0 | 1,
): Promise<number> {
  let n = 0;
  for (const title of titles) {
    n += await db().update('userBgm', { userNickname, title }, { allocation });
  }
  return n;
}

/* ================================================================== */
/* 공지사항 (NoticeMapper)                                             */
/* ================================================================== */

export async function getNoticeList(params: { page?: number; seq?: number }) {
  const all = (await db().select('notice')).filter((n) => n.del_yn.toUpperCase() !== 'Y');
  const sorted = desc(all, (n) => n.create_date);
  const rows = params.seq != null ? sorted.filter((n) => n.seq === params.seq) : sorted;
  const page = params.page && params.page > 0 ? params.page : 1;
  const offset = PAGE_SIZE * (page - 1);
  return (params.seq != null ? rows : rows.slice(offset, offset + PAGE_SIZE)).map((n) => ({
    ...n,
    date: ymd(n.create_date),
  }));
}

export async function getNoticePageCount(): Promise<number> {
  const all = (await db().select('notice')).filter((n) => n.del_yn.toUpperCase() !== 'Y');
  return Math.max(1, Math.ceil(all.length / PAGE_SIZE));
}

/** sendMainBar: 미니홈피 하단 롤링 공지 5개 */
export async function sendMainBar() {
  const all = (await db().select('notice')).filter((n) => n.del_yn.toUpperCase() !== 'Y');
  return desc(all, (n) => n.update_date)
    .slice(0, 5)
    .map((n) => ({ seq: n.seq, title: n.title }));
}

export async function insertNotice(writer: string, title: string, content: string) {
  const now = nowIso();
  await db().insert('notice', {
    writer, title, content, create_date: now, update_date: now, del_yn: 'N',
  });
}

export async function modifyNotice(seq: number, title: string, content: string) {
  return db().update('notice', { seq }, { title, content, update_date: nowIso() });
}

export async function deleteNotice(seqs: number[]) {
  for (const seq of seqs) {
    await db().update('notice', { seq }, { del_yn: 'Y' } as Partial<Notice>);
  }
}

/* ================================================================== */
/* 게시판 (BoardMapper)                                                */
/* ================================================================== */

export interface BoardListRow extends Board {
  newcontent: 0 | 1;
}

export async function getBoardList(params: {
  userNickname: string;
  page?: number;
  seq?: number;
}): Promise<BoardListRow[]> {
  const all = (await db().select('board', { userNickname: params.userNickname })).filter(
    (b) => b.del_yn.toUpperCase() === 'N' && b.openScope === 1,
  );
  const filtered = params.seq != null ? all.filter((b) => b.seq === params.seq) : all;
  const sorted = [...filtered].sort((a, b) => b.seq - a.seq);
  const page = params.page && params.page > 0 ? params.page : 1;
  const offset = PAGE_SIZE * (page - 1);
  const sliced = params.seq != null ? sorted : sorted.slice(offset, offset + PAGE_SIZE);
  return sliced.map((b) => ({ ...b, newcontent: withinHours(b.update_date, 24) ? 1 : 0 }));
}

export async function getBoardPageCount(userNickname: string): Promise<number> {
  const all = (await db().select('board', { userNickname })).filter(
    (b) => b.del_yn.toUpperCase() === 'N' && b.openScope === 1,
  );
  return Math.max(1, Math.ceil(all.length / PAGE_SIZE));
}

export async function getBoardContent(seq: number): Promise<Board | null> {
  const rows = await db().select('board', { seq });
  return rows[0] ?? null;
}

export async function insertBoard(userNickname: string, title: string, content: string) {
  const now = nowIso();
  await db().insert('board', {
    userNickname, title, content, imagePath: '', hits: 0,
    create_date: now, update_date: now, del_yn: 'N', openScope: 1,
  });
}

export async function modifyBoard(seq: number, title: string, content: string) {
  return db().update('board', { seq }, { title, content, update_date: nowIso() });
}

export async function updateBoardHit(seq: number, userNickname: string) {
  const row = (await db().select('board', { seq, userNickname }))[0];
  if (!row) return 0;
  return db().update('board', { seq }, { hits: row.hits + 1 });
}

export async function deleteBoards(seqs: number[]) {
  for (const seq of seqs) {
    await db().update('board', { seq }, { del_yn: 'Y' } as Partial<Board>);
  }
}

export async function getBoardComments(boardSeq: number) {
  const rows = await db().select('boardCMT', { boardSeq, openScope: 1 });
  return desc(rows, (c) => c.update_date).map((c) => ({
    seq: c.seq,
    userNickname: c.userNickname,
    content: c.content,
    update_date_format: ymdhmDot(c.update_date),
  }));
}

export async function insertBoardComment(
  boardSeq: number,
  userNickname: string,
  content: string,
) {
  const now = nowIso();
  await db().insert('boardCMT', {
    boardSeq, userNickname, content, create_date: now, update_date: now, openScope: 1,
  } as Omit<BoardComment, 'seq'>);
}

export async function deleteBoardComment(seq: number) {
  return db().remove('boardCMT', { seq });
}

/* ================================================================== */
/* 다이어리 (DiaryMapper)                                              */
/* ================================================================== */

export async function selectDiaryByDate(userNickname: string, date: string) {
  const rows = await db().select('diary', { userNickname });
  const found = rows.find((d) => d.diary_date === date && d.del_yn.toLowerCase() === 'n');
  return found ? { ...found, formatted_update_date: ymd(found.diary_date) } : null;
}

export async function selectTodayDiary(userNickname: string) {
  return selectDiaryByDate(userNickname, todayYmd());
}

export async function selectDiaryOne(seq: number) {
  const rows = await db().select('diary', { seq });
  const found = rows[0];
  return found ? { ...found, formatted_update_date: ymd(found.diary_date) } : null;
}

export async function insertDiary(params: {
  userNickname: string;
  title: string;
  content: string;
  visibility: 0 | 1;
  diary_date: string;
}) {
  const now = nowIso();
  await db().insert('diary', {
    userNickname: params.userNickname,
    title: params.title,
    content: params.content,
    hits: 0,
    create_date: now,
    update_date: now,
    diary_date: params.diary_date,
    del_yn: 'n',
    openScope: params.visibility,
  } as Omit<Diary, 'seq'>);
}

export async function modifyDiary(
  seq: number,
  title: string,
  content: string,
  visibility: 0 | 1,
) {
  return db().update(
    'diary',
    { seq },
    { title, content, update_date: nowIso(), openScope: visibility },
  );
}

export async function deleteDiary(seq: number) {
  return db().update('diary', { seq }, { del_yn: 'y' } as Partial<Diary>);
}

export async function getDiaryComments(diarySeq: number) {
  const rows = await db().select('diaryCMT', { diarySeq });
  return [...rows]
    .sort((a, b) => b.seq - a.seq)
    .map((c) => ({ ...c, cmtDate: ymdhm(c.create_date) }));
}

export async function insertDiaryComment(
  diarySeq: number,
  userNickname: string,
  content: string,
) {
  await db().insert('diaryCMT', {
    diarySeq, userNickname, content, create_date: nowIso(), openScope: 1,
  } as Omit<DiaryComment, 'seq'>);
}

/** selectDiaryCMT: 이 유저의 모든 다이어리에 달린 댓글 (diarySeq 별로 묶어 쓴다) */
export async function selectAllDiaryComments(userNickname: string) {
  const diaries = await db().select('diary', { userNickname });
  if (diaries.length === 0) return [];

  const comments = await db().selectIn('diaryCMT', 'diarySeq', diaries.map((d) => d.seq));
  return comments
    .sort((a, b) => b.seq - a.seq)
    .map((c) => ({
      commentSeq: c.seq,
      commentUserNickname: c.userNickname,
      commentContent: c.content,
      commentCreateDate: ymdhm(c.create_date),
      diarySeq: c.diarySeq,
    }));
}

/* ================================================================== */
/* 사진첩 (AlbumMapper)                                                */
/* ================================================================== */

export async function selectAlbums(userNickname: string, seq?: number): Promise<Album[]> {
  const rows = (await db().select('album', { userNickname })).filter(
    (a) => a.del_yn.toUpperCase() !== 'Y',
  );
  const filtered = seq != null ? rows.filter((a) => a.seq === seq) : rows;
  return [...filtered].sort((a, b) => b.seq - a.seq);
}

export async function insertAlbum(params: {
  userNickname: string;
  title: string;
  content: string;
  imagePath: string;
  openScope: 0 | 1;
}) {
  const now = nowIso();
  await db().insert('album', {
    ...params, create_date: now, update_date: now, del_yn: 'N',
  } as Omit<Album, 'seq'>);
}

export async function deleteAlbum(seq: number) {
  return db().update('album', { seq }, { del_yn: 'Y' } as Partial<Album>);
}

/* ================================================================== */
/* 방명록 (VisitMapper)                                                */
/* ================================================================== */

export async function selectVisitCount(targetNickname: string): Promise<number> {
  return (await db().select('visit', { targetNickname })).length;
}

export async function selectVisitComments(targetNickname: string, page = 1) {
  const visits = await db().select('visit', { targetNickname });

  const offset = (page - 1) * VISIT_PAGE_SIZE;
  const pageRows = desc(visits, (v) => v.update_date).slice(offset, offset + VISIT_PAGE_SIZE);
  if (pageRows.length === 0) return [];

  // 이 페이지에 등장하는 작성자들의 미니미·이름만 골라 온다
  const writers = [...new Set(pageRows.map((v) => v.userNickname))];
  const [storages, users] = await Promise.all([
    db().selectIn('userStorage', 'userNickname', writers),
    db().selectIn('user', 'userNickname', writers),
  ]);
  const minimiOf = new Map(
    storages
      .filter((s) => s.category === 'minimi' && s.allocation === 1)
      .map((s) => [s.userNickname, s.contentPath]),
  );
  const nameOf = new Map(users.map((u) => [u.userNickname, u.userName]));

  return pageRows
    .map((v, i) => ({
      number: offset + i + 1,
      userNickname: v.userNickname,
      targetNickname: v.targetNickname,
      content: v.content,
      create_date: v.create_date,
      update_date: ymdhmDot(v.update_date),
      contentPath: minimiOf.get(v.userNickname) ?? DEFAULT_MINIMI_PATH,
      userName: nameOf.get(v.userNickname) ?? v.userNickname,
    }));
}

export async function insertVisitComment(
  userNickname: string,
  targetNickname: string,
  content: string,
) {
  const now = nowIso();
  await db().insert('visit', {
    userNickname, targetNickname, content, create_date: now, update_date: now,
  } as Omit<Visit, 'seq'>);
}

export async function updateVisitComment(params: {
  userNickname: string;
  targetNickname: string;
  originalContent: string;
  newContent: string;
}): Promise<number> {
  const rows = await db().select('visit', {
    userNickname: params.userNickname,
    targetNickname: params.targetNickname,
    content: params.originalContent,
  });
  if (rows.length === 0) return 0;
  return db().update(
    'visit',
    { seq: rows[0].seq },
    { content: params.newContent, update_date: nowIso() },
  );
}

export async function deleteVisitComment(params: {
  userNickname: string;
  targetNickname: string;
  content: string;
}): Promise<number> {
  return db().remove('visit', {
    userNickname: params.userNickname,
    targetNickname: params.targetNickname,
    content: params.content,
  });
}

export function visitPageCount(totalCnt: number): number {
  return Math.max(1, Math.ceil(totalCnt / VISIT_PAGE_SIZE));
}
