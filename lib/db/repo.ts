import { getStore, type Table } from './store';
import { nowIso, todayYmd, withinHours, ymd, ymdDot, ymdhm, ymdhmDot } from './format';
import { canEnterHome, canView, visibleTo, type Scope, type Viewer } from './visibility';
import { CHAT_TTL_MS } from '../plaza/protocol';
import type {
  Album, AlbumComment, Board, BoardComment, Diary, DiaryComment, ForestRecord, Friend,
  FriendStatus, Notice, NotiRead, PlazaChat, StorageCategory, StoreItem, User, Visit,
} from './types';

/**
 * 구 DAO/Service 계층(com.core.tjoeun.**.dao / **.service)이 하던 일을
 * 그대로 옮긴 도메인 함수 모음. MyBatis 매퍼 XML 의 각 쿼리와 1:1 로 대응한다.
 */

const db = () => getStore();

const PAGE_SIZE = 10;
const VISIT_PAGE_SIZE = 5;
/*
 * 상점은 목록이 아니라 격자다 (.productList 가 auto-fill).
 * 10 개면 4 개씩 깔릴 때 마지막 줄에 2 개만 남아 허전하다.
 * 12 는 한 줄에 2·3·4·6 개 어느 쪽으로 깔려도 줄이 딱 떨어진다.
 */
const STORE_PAGE_SIZE = 12;

export const DEFAULT_MINIMI_PATH = '/resources/images/default/defaultMinimiIcon.gif';
export const DEFAULT_BACKGROUND_PATH = '/resources/images/default/defaultBg.jpg';
export const DEFAULT_SKIN_COLOR = 'rgb(42, 140, 168)';
export const DEFAULT_PROFILE_IMAGE = 'defaultProfile.png';

/** NoticeController 가 하드코딩하고 있던 관리자 닉네임 */
export const ADMIN_NICKNAMES = ['제인', '관리자'];

/**
 * 광장 공지를 띄울 수 있는 사람 — 닉네임이 아니라 '이름' 으로 정한다.
 * (닉네임은 본인이 바꿀 수 있어서 기준으로 쓰기에 약하다)
 */
export const PLAZA_ADMIN_NAME = '이진우';

/**
 * 광장 관리자의 닉네임.
 *
 * 공지는 실시간 채널로 사람들끼리 직접 주고받으므로, 받는 쪽이 '관리자가 보낸 것인지'
 * 를 스스로 확인할 수 있어야 한다. 그래서 이름으로 찾은 관리자의 닉네임을 모두에게
 * 미리 알려 주고, 그 닉네임에서 온 공지만 띄운다.
 */
export async function getPlazaAdminNickname(): Promise<string | null> {
  try {
    const rows = await db().select('user', { userName: PLAZA_ADMIN_NAME });
    return rows[0]?.userNickname ?? null;
  } catch (error) {
    console.error('[plazaAdmin]', error);
    return null;
  }
}

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

/**
 * '일촌 ON' 으로 볼 수 있는 마지막 생존 신호 유효시간(분).
 *
 * status 만 보면 브라우저를 닫거나 PC 를 끈 사람이 영영 접속중으로 남는다
 * (로그아웃 버튼을 눌러야만 '0' 이 되므로). 그래서 실제 판정은
 * "status='1' 이면서 last_seen 이 이 시간 안" 으로 한다.
 * 클라이언트는 HEARTBEAT_MS 마다 신호를 보내므로 그보다 넉넉히 잡는다.
 */
export const ONLINE_WINDOW_MINUTES = 5;

export async function loginOnStatus(userNickname: string) {
  const existing = await db().select('loginStatus', { userNickname });
  if (existing.length === 0) {
    await db().insert('loginStatus', { userNickname, status: '1', last_seen: nowIso() });
  } else {
    await db().update('loginStatus', { userNickname }, { status: '1', last_seen: nowIso() });
  }
}

export async function loginOffStatus(userNickname: string) {
  await db().update('loginStatus', { userNickname }, { status: '0' });
}

/**
 * 살아있다는 신호. 열려 있는 탭이 주기적으로 부른다.
 * 이 갱신이 멈추면 ONLINE_WINDOW_MINUTES 뒤에 자동으로 '일촌 ON' 에서 빠진다.
 */
export async function touchLoginStatus(userNickname: string) {
  const changed = await db().update(
    'loginStatus',
    { userNickname },
    { status: '1', last_seen: nowIso() },
  );
  // 예전 계정이라 행이 없을 수도 있다
  if (changed === 0) {
    await db().insert('loginStatus', { userNickname, status: '1', last_seen: nowIso() });
  }
}

/** last_seen 이 유효시간 안인가 (값이 없는 옛 행은 접속중으로 보지 않는다) */
function seenRecently(last?: string): boolean {
  if (!last) return false;
  const t = new Date(last).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= ONLINE_WINDOW_MINUTES * 60 * 1000;
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
  await s.insert('visitCnt', {
    userNickname: params.userNickname, todayCnt: 0, totalCnt: 0, cnt_date: todayYmd(),
  });
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
  // 로그아웃을 안 눌렀어도 신호가 끊긴 지 오래면 접속중이 아니다
  const online = new Set(
    statuses
      .filter((s) => s.status === '1' && seenRecently(s.last_seen))
      .map((s) => s.userNickname),
  );
  return nicknames.filter((n) => online.has(n));
}

/** 나에게 들어온 대기중 일촌 신청 수 (getFriendCount) */
export async function getPendingFriendRequestCount(userNickname: string): Promise<number> {
  const rows = await db().select('friends', { friendNickname: userNickname, fStatus: 0 });
  return rows.filter((f) => f.del_yn.toUpperCase() !== 'Y').length;
}

export interface PendingFriendRequest {
  seq: number;
  requesterNickname: string;
  requesterName: string;
  createDate: string;
}

/** 나에게 들어온 대기중 일촌 신청 목록 (신청자 이름 포함) — 메인 화면에서 수락/거절용 */
export async function selectPendingFriendRequests(
  userNickname: string,
): Promise<PendingFriendRequest[]> {
  const rows = (await db().select('friends', { friendNickname: userNickname, fStatus: 0 })).filter(
    (f) => f.del_yn.toUpperCase() !== 'Y',
  );
  if (rows.length === 0) return [];

  const requesters = [...new Set(rows.map((f) => f.userNickname))];
  const users = await db().selectIn('user', 'userNickname', requesters);
  const nameOf = new Map(users.map((u) => [u.userNickname, u.userName]));

  return rows.map((f) => ({
    seq: f.seq,
    requesterNickname: f.userNickname,
    requesterName: nameOf.get(f.userNickname) ?? f.userNickname,
    createDate: ymd(f.createDate),
  }));
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

/**
 * 방문자 수.
 *
 * '오늘 방문자' 를 자정에 0 으로 되돌려 주는 배치가 없어서, 예전에는 한 번 올라간
 * 숫자가 계속 쌓이기만 했다. 크론을 두는 대신 '이 숫자가 어느 날 것인지'(cnt_date)를
 * 같이 저장해 두고, 날짜가 바뀌었으면 0 부터 다시 센다.
 *
 * 읽을 때도 같은 기준으로 걸러 주므로, 오늘 아직 아무도 안 왔으면
 * 어제 숫자가 아니라 0 이 보인다. (읽기는 DB 를 건드리지 않는다)
 */
export async function selectVisitCnt(userNickname: string) {
  const row = (await db().select('visitCnt', { userNickname }))[0];
  if (!row) return null;
  const stale = row.cnt_date !== todayYmd();
  return stale ? { ...row, todayCnt: 0 } : row;
}

/** 방문할 때마다 today/total 을 1씩 올린다 (MainServiceImpl.updateVisitCnt) */
export async function updateVisitCnt(
  userNickname: string,
): Promise<{ todayCnt: number; totalCnt: number }> {
  const today = todayYmd();
  const row = (await db().select('visitCnt', { userNickname }))[0];

  if (!row) {
    await db().insert('visitCnt', { userNickname, todayCnt: 1, totalCnt: 1, cnt_date: today });
    return { todayCnt: 1, totalCnt: 1 };
  }

  // 날이 바뀌었으면 오늘 숫자는 0 부터 다시 (누적 방문수는 그대로 이어간다)
  const todayCnt = (row.cnt_date === today ? row.todayCnt : 0) + 1;
  const totalCnt = row.totalCnt + 1;
  await db().update('visitCnt', { userNickname }, { todayCnt, totalCnt, cnt_date: today });
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
  /** 0 = 비공개(일촌만 입장), 1 = 공개. 값이 없는 옛 계정은 공개로 본다. */
  homeOpenScope: 0 | 1;
} | null> {
  // user / title 는 서로 독립이라 한 번에 병렬로 가져온다 (왕복 2 → 1)
  const [users, titleRows] = await Promise.all([
    db().select('user', { userNickname }),
    db().select('miniHomeTitle', { userNickname }),
  ]);
  const user = users[0];
  if (!user) return null;
  const titleRow = titleRows[0];
  return {
    seq: titleRow?.seq ?? null,
    title: titleRow?.title ?? `${user.userName}의 미니홈피입니다.`,
    userGender: user.userGender,
    userName: user.userName,
    homeOpenScope: user.homeOpenScope === 0 ? 0 : 1,
  };
}

/** 관리 화면에서 미니홈피 공개/비공개를 바꾼다 */
export async function updateHomeOpenScope(userNickname: string, scope: 0 | 1): Promise<number> {
  return db().update('user', { userNickname }, { homeOpenScope: scope });
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

/**
 * 승인된 일촌별로 "언제부터 일촌인지" (닉네임 → ISO).
 *
 * 알림은 이 시각 이후에 올라온 글만 보낸다. acceptDate 컬럼이 생기기 전에 맺은
 * 관계는 값이 없으므로 신청일(createDate)로 대신한다.
 * 끊었다 다시 맺은 관계가 여러 행 남아 있으면 가장 최근 것을 쓴다.
 */
export async function getFriendSince(userNickname: string): Promise<Map<string, string>> {
  const accepted = (await myFriendRows(userNickname)).filter((f) => f.fStatus === 1);
  const since = new Map<string, string>();

  for (const row of accepted) {
    const other = otherSide(row, userNickname);
    if (!other || other === userNickname) continue;
    const at = row.acceptDate || row.createDate;
    const prev = since.get(other);
    if (!prev || new Date(at).getTime() > new Date(prev).getTime()) since.set(other, at);
  }
  return since;
}

/**
 * 두 사람 사이에 이미 (삭제되지 않은) 일촌 관계가 있는지 — 신청중(0)/승인(1) 모두 포함.
 * insertFriendRequest 가 -1 로 막는 조건과 동일하다. 일촌신청 버튼 노출 여부에 쓴다.
 */
export async function hasFriendRelation(a: string, b: string): Promise<boolean> {
  if (!a || !b || a === b) return false;
  const rows = await db().selectOr('friends', [
    { userNickname: a, friendNickname: b },
    { userNickname: b, friendNickname: a },
  ]);
  return rows.some((f) => f.del_yn.toUpperCase() !== 'Y');
}

/**
 * 어떤 홈피에서 이 사람이 어떤 자격인지 한 번에 구한다.
 * 페이지·API 라우트가 제각기 계산하다 빠뜨리는 일이 없도록 여기로 모았다.
 */
export async function resolveViewer(
  ownerNickname: string,
  viewerNickname: string | undefined | null,
): Promise<Viewer> {
  const isOwner = Boolean(viewerNickname) && viewerNickname === ownerNickname;
  if (isOwner) return { isOwner: true, isFriend: true };
  if (!viewerNickname) return { isOwner: false, isFriend: false };
  return { isOwner: false, isFriend: (await friendCheck(viewerNickname, ownerNickname)) === 1 };
}

/** 이 사람이 그 미니홈피 자체를 볼 수 있는가 (비공개 홈피 차단) */
export async function canSeeHome(ownerNickname: string, viewer: Viewer): Promise<boolean> {
  const owner = await getHomeOwnerInfo(ownerNickname);
  if (!owner) return false;
  return canEnterHome(owner.homeOpenScope, viewer);
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
export async function selectCurrentContent(userNickname: string, viewer: Viewer) {
  const [boards, albums] = await Promise.all([
    db().select('board', { userNickname }),
    db().select('album', { userNickname }),
  ]);
  const rows = [
    ...boards
      .filter((b) => b.del_yn.toUpperCase() === 'N' && canView(b.openScope, viewer))
      .map((b) => ({ seq: b.seq, title: b.title, tableName: 'board', update_date: b.update_date })),
    ...albums
      .filter((a) => a.del_yn.toUpperCase() === 'N' && canView(a.openScope, viewer))
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
  const offset = STORE_PAGE_SIZE * (page - 1);
  return rows.slice(offset, offset + STORE_PAGE_SIZE);
}

/** selectStoreCnt: 전체 페이지 수 */
export async function getStorePageCount(category: StorageCategory): Promise<number> {
  const rows = (await db().select('store', { category })).filter(
    (s) => s.productName !== '기본 미니미',
  );
  return Math.max(1, Math.ceil(rows.length / STORE_PAGE_SIZE));
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

export interface MinihomeSearchResult {
  userNickname: string;
  userName: string;
  userEmail: string;
}

/**
 * 닉네임/이름 부분검색으로 방문할 미니홈피를 찾는다.
 * (searchUser 는 완전일치라 "둘러보기" 에는 쓸 수 없어 따로 둔다)
 */
export async function searchUsers(
  keyword: string,
  { exclude, limit = 20 }: { exclude?: string; limit?: number } = {},
): Promise<MinihomeSearchResult[]> {
  const q = keyword.trim().toLowerCase();
  if (!q) return [];

  const rows = await db().select('user');
  return rows
    .filter((u) => u.userNickname !== exclude)
    .filter(
      (u) =>
        u.userNickname.toLowerCase().includes(q) ||
        (u.userName ?? '').toLowerCase().includes(q),
    )
    .slice(0, limit)
    .map((u) => ({
      userNickname: u.userNickname,
      userName: u.userName,
      userEmail: u.userEmail,
    }));
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
  if (patch.fStatus != null) {
    change.fStatus = patch.fStatus;
    // 승인하는 순간을 남긴다 — 일촌의 새 글 알림은 이 시각 이후 것만 보낸다
    if (patch.fStatus === 1) change.acceptDate = nowIso();
  }
  if (patch.del != null) change.del_yn = patch.del;
  if (Object.keys(change).length === 0) return 0;

  try {
    return await db().update('friends', { seq }, change);
  } catch (error) {
    /*
     * acceptDate 컬럼은 손으로 추가하는 것이라 '배포는 됐고 SQL 은 아직' 인 순간이 있다.
     * 그때 컬럼이 없다고 통째로 실패하면 일촌 수락 자체가 안 된다. 그 값만 빼고 한 번 더 한다.
     * (없으면 getFriendSince 가 신청일로 대신 보므로 알림도 그럭저럭 맞는다)
     */
    if (change.acceptDate == null) throw error;
    console.error('[friends:acceptDate 없이 재시도]', error);
    delete change.acceptDate;
    return db().update('friends', { seq }, change);
  }
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
  commentCnt: number;
}

export async function getBoardList(params: {
  userNickname: string;
  page?: number;
  seq?: number;
  viewer: Viewer;
}): Promise<BoardListRow[]> {
  const all = (await db().select('board', { userNickname: params.userNickname })).filter(
    (b) => b.del_yn.toUpperCase() === 'N' && canView(b.openScope, params.viewer),
  );
  const filtered = params.seq != null ? all.filter((b) => b.seq === params.seq) : all;
  const sorted = [...filtered].sort((a, b) => b.seq - a.seq);
  const page = params.page && params.page > 0 ? params.page : 1;
  const offset = PAGE_SIZE * (page - 1);
  const sliced = params.seq != null ? sorted : sorted.slice(offset, offset + PAGE_SIZE);

  // 이 페이지에 보이는 글들의 댓글 수(답글 포함)를 한 번에 세어 붙인다
  const seqs = sliced.map((b) => b.seq);
  const cmts = await db().selectIn('boardCMT', 'boardSeq', seqs);
  const cntOf = new Map<number, number>();
  for (const c of cmts) {
    if (c.openScope === 1) cntOf.set(c.boardSeq, (cntOf.get(c.boardSeq) ?? 0) + 1);
  }

  return sliced.map((b) => ({
    ...b,
    newcontent: withinHours(b.update_date, 24) ? 1 : 0,
    commentCnt: cntOf.get(b.seq) ?? 0,
  }));
}

export async function getBoardPageCount(userNickname: string, viewer: Viewer): Promise<number> {
  const all = (await db().select('board', { userNickname })).filter(
    (b) => b.del_yn.toUpperCase() === 'N' && canView(b.openScope, viewer),
  );
  return Math.max(1, Math.ceil(all.length / PAGE_SIZE));
}

export async function getBoardContent(seq: number): Promise<Board | null> {
  const rows = await db().select('board', { seq });
  return rows[0] ?? null;
}

export async function insertBoard(
  userNickname: string,
  title: string,
  content: string,
  openScope: Scope = 1,
) {
  const now = nowIso();
  await db().insert('board', {
    userNickname, title, content, imagePath: '', hits: 0,
    create_date: now, update_date: now, del_yn: 'N', openScope,
  });
}

export async function modifyBoard(seq: number, title: string, content: string, openScope?: Scope) {
  return db().update(
    'board',
    { seq },
    openScope == null
      ? { title, content, update_date: nowIso() }
      : { title, content, openScope, update_date: nowIso() },
  );
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
  // 원댓글은 오래된→최신 순, 답글도 오래된→최신 순으로 부모 밑에 붙는다.
  // (여기서는 플랫하게 내려주고, 화면에서 parentSeq 로 묶는다)
  return [...rows]
    .sort((a, b) => a.seq - b.seq)
    .map((c) => ({
      seq: c.seq,
      userNickname: c.userNickname,
      content: c.content,
      update_date_format: ymdhmDot(c.update_date),
      parentSeq: c.parentSeq ?? null,
    }));
}

export async function insertBoardComment(
  boardSeq: number,
  userNickname: string,
  content: string,
  parentSeq: number | null = null,
) {
  const now = nowIso();
  await db().insert('boardCMT', {
    boardSeq, userNickname, content, create_date: now, update_date: now, openScope: 1,
    parentSeq,
  } as Omit<BoardComment, 'seq'>);
}

export async function deleteBoardComment(seq: number) {
  // 원댓글을 지우면 딸린 답글도 함께 지운다 (Supabase 는 FK cascade 로도 처리됨)
  const children = await db().select('boardCMT', { parentSeq: seq } as Partial<BoardComment>);
  for (const child of children) await db().remove('boardCMT', { seq: child.seq });
  return db().remove('boardCMT', { seq });
}

/* ---- 사진첩 댓글 (게시판 댓글과 동일 구조 + 답글) ---- */

export async function getAlbumComments(albumSeq: number) {
  const rows = await db().select('albumCMT', { albumSeq, openScope: 1 });
  return [...rows]
    .sort((a, b) => a.seq - b.seq)
    .map((c) => ({
      seq: c.seq,
      userNickname: c.userNickname,
      content: c.content,
      update_date_format: ymdhmDot(c.update_date),
      parentSeq: c.parentSeq ?? null,
    }));
}

export async function insertAlbumComment(
  albumSeq: number,
  userNickname: string,
  content: string,
  parentSeq: number | null = null,
) {
  const now = nowIso();
  await db().insert('albumCMT', {
    albumSeq, userNickname, content, create_date: now, update_date: now, openScope: 1,
    parentSeq,
  } as Omit<AlbumComment, 'seq'>);
}

export async function deleteAlbumComment(seq: number) {
  const children = await db().select('albumCMT', { parentSeq: seq } as Partial<AlbumComment>);
  for (const child of children) await db().remove('albumCMT', { seq: child.seq });
  return db().remove('albumCMT', { seq });
}

/* ================================================================== */
/* 다이어리 (DiaryMapper)                                              */
/* ================================================================== */

export async function selectDiaryByDate(userNickname: string, date: string, viewer: Viewer) {
  const rows = await db().select('diary', { userNickname });
  const found = rows.find(
    (d) =>
      d.diary_date === date && d.del_yn.toLowerCase() === 'n' && canView(d.openScope, viewer),
  );
  return found ? { ...found, formatted_update_date: ymd(found.diary_date) } : null;
}

export async function selectTodayDiary(userNickname: string, viewer: Viewer) {
  return selectDiaryByDate(userNickname, todayYmd(), viewer);
}

/**
 * 가장 최근(작성일 기준) 다이어리 한 건.
 *
 * 서버 시간대(UTC)와 작성자 시간대(KST)가 달라 "오늘"이 어긋나면 방금 쓴 일기가
 * 오늘 글 조회에서 빠질 수 있다. 그때 이 함수로 최신 글을 대신 보여 주면
 * 작성 직후 바로 화면에 반영된다.
 */
export async function selectLatestDiary(userNickname: string, viewer: Viewer) {
  const rows = (await db().select('diary', { userNickname })).filter(
    (d) => d.del_yn.toLowerCase() === 'n' && canView(d.openScope, viewer),
  );
  const found = desc(rows, (d) => d.diary_date)[0];
  return found ? { ...found, formatted_update_date: ymd(found.diary_date) } : null;
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
  visibility: Scope;
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
  visibility: Scope,
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

/**
 * 다이어리 댓글 — 게시판·사진첩과 같은 모양(ThreadComment)으로 돌려준다.
 * 원댓글은 오래된→최신 순, 답글은 화면에서 parentSeq 로 부모 밑에 묶는다.
 */
export async function getDiaryComments(diarySeq: number) {
  const rows = await db().select('diaryCMT', { diarySeq });
  return [...rows]
    .sort((a, b) => a.seq - b.seq)
    .map((c) => ({
      seq: c.seq,
      userNickname: c.userNickname,
      content: c.content,
      update_date_format: ymdhmDot(c.create_date),
      parentSeq: c.parentSeq ?? null,
    }));
}

export async function insertDiaryComment(
  diarySeq: number,
  userNickname: string,
  content: string,
  parentSeq: number | null = null,
) {
  await db().insert('diaryCMT', {
    diarySeq, userNickname, content, create_date: nowIso(), openScope: 1,
    parentSeq,
  } as Omit<DiaryComment, 'seq'>);
}

export async function deleteDiaryComment(seq: number) {
  // 원댓글을 지우면 딸린 답글도 함께 (Supabase 는 FK cascade 로도 처리됨)
  const children = await db().select('diaryCMT', { parentSeq: seq } as Partial<DiaryComment>);
  for (const child of children) await db().remove('diaryCMT', { seq: child.seq });
  return db().remove('diaryCMT', { seq });
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

export async function selectAlbums(
  userNickname: string,
  viewer: Viewer,
  seq?: number,
): Promise<Album[]> {
  const rows = visibleTo(
    (await db().select('album', { userNickname })).filter((a) => a.del_yn.toUpperCase() !== 'Y'),
    viewer,
  );
  const filtered = seq != null ? rows.filter((a) => a.seq === seq) : rows;
  return [...filtered].sort((a, b) => b.seq - a.seq);
}

/** 사진 한 장 (공개범위 판정은 부르는 쪽에서 한다 — getBoardContent 와 같은 형태) */
export async function getAlbumContent(seq: number): Promise<Album | null> {
  const rows = await db().select('album', { seq });
  return rows[0] ?? null;
}

export async function insertAlbum(params: {
  userNickname: string;
  title: string;
  content: string;
  imagePath: string;
  openScope: Scope;
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

/**
 * 방명록에서 이 사람이 볼 수 있는 글.
 * 방명록은 남이 내 홈에 남기는 글이라, '나만보기(0)' 는 홈 주인과 작성자 본인만 본다.
 */
function visibleVisits(rows: Visit[], viewer: Viewer, viewerNickname: string): Visit[] {
  return rows.filter(
    (v) => canView(v.openScope, viewer) || v.userNickname === viewerNickname,
  );
}

export async function selectVisitCount(
  targetNickname: string,
  viewer: Viewer,
  viewerNickname: string,
): Promise<number> {
  const rows = await db().select('visit', { targetNickname });
  return visibleVisits(rows, viewer, viewerNickname).length;
}

export async function selectVisitComments(
  targetNickname: string,
  viewer: Viewer,
  viewerNickname: string,
  page = 1,
) {
  const visits = visibleVisits(await db().select('visit', { targetNickname }), viewer, viewerNickname);

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
      seq: v.seq,
      number: offset + i + 1,
      userNickname: v.userNickname,
      targetNickname: v.targetNickname,
      content: v.content,
      create_date: v.create_date,
      update_date: ymdhmDot(v.update_date),
      contentPath: minimiOf.get(v.userNickname) ?? DEFAULT_MINIMI_PATH,
      userName: nameOf.get(v.userNickname) ?? v.userNickname,
      reply: v.reply ?? null,
      replyDate: v.reply_date ? ymdhmDot(v.reply_date) : null,
    }));
}

/** 미니홈피 주인이 방문글(seq)에 답글을 달거나 수정한다. 빈 문자열이면 답글을 지운다. */
export async function replyVisitComment(params: {
  seq: number;
  targetNickname: string;
  reply: string;
}): Promise<number> {
  const reply = params.reply.trim();
  return db().update(
    'visit',
    { seq: params.seq, targetNickname: params.targetNickname },
    { reply: reply || null, reply_date: reply ? nowIso() : null } as Partial<Visit>,
  );
}

export async function insertVisitComment(
  userNickname: string,
  targetNickname: string,
  content: string,
  openScope: Scope = 1,
) {
  const now = nowIso();
  await db().insert('visit', {
    userNickname, targetNickname, content, create_date: now, update_date: now, openScope,
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

/* ================================================================== */
/* 광장 채팅 기록                                                       */
/* ================================================================== */

/** 화면에 되살릴 지난 대화 수 */
export const PLAZA_CHAT_LIMIT = 60;

export interface PlazaChatRow {
  seq: number;
  nickname: string;
  text: string;
  /** 발송 시각 ISO — 표기(HH:MM)와 2시간 경과 판정은 클라이언트가 KST 로 한다 */
  at: string;
}

/**
 * 오래된 → 최신 순 (화면 로그와 같은 순서).
 * 발송한 지 CHAT_TTL_MS(2시간) 넘은 줄은 돌려주지 않는다.
 */
export async function getPlazaChat(limit = PLAZA_CHAT_LIMIT): Promise<PlazaChatRow[]> {
  const rows = await db().select('plazaChat');
  const cutoff = Date.now() - CHAT_TTL_MS;
  return [...rows]
    .filter((c) => new Date(c.create_date).getTime() >= cutoff)
    .sort((a, b) => a.seq - b.seq)
    .slice(-limit)
    .map((c) => ({ seq: c.seq, nickname: c.userNickname, text: c.content, at: c.create_date }));
}

export async function insertPlazaChat(userNickname: string, content: string) {
  const row = await db().insert('plazaChat', {
    userNickname, content, create_date: nowIso(),
  } as Omit<PlazaChat, 'seq'>);

  // 2시간 지난 줄은 지운다. 줄 수 상한을 두는 대신 시간으로 자르므로
  // 기록이 무한히 쌓이지 않고, 광장에 오래 머무는 사람의 화면과도 기준이 같다.
  const cutoff = Date.now() - CHAT_TTL_MS;
  const stale = (await db().select('plazaChat')).filter(
    (c) => new Date(c.create_date).getTime() < cutoff,
  );
  for (const r of stale) await db().remove('plazaChat', { seq: r.seq });

  return row;
}

/* ================================================================== */
/* 인내의 숲 등반 기록                                                  */
/* ================================================================== */

export interface ForestRecordRow {
  nickname: string;
  ms: number;
}

/**
 * 기록을 남긴다. 그 사람의 그 맵 기록보다 빠를 때만 갱신한다.
 * 사람마다 한 줄만 두므로 팻말의 '상위 3명' 이 정말 3명이 된다.
 *
 * 돌려주는 값: 갱신했으면 true (개인 최고 기록)
 */
export async function saveForestRecord(
  userNickname: string,
  map: string,
  ms: number,
): Promise<boolean> {
  const [mine] = await db().select('forestRecord', { userNickname, map });

  if (!mine) {
    await db().insert('forestRecord', {
      userNickname, map, ms, create_date: nowIso(),
    } as Omit<ForestRecord, 'seq'>);
    return true;
  }
  if (ms >= mine.ms) return false;

  await db().update('forestRecord', { seq: mine.seq }, { ms, create_date: nowIso() });
  return true;
}

/**
 * 빠른 순으로 상위 몇 명.
 *
 * 실패하면 빈 목록으로 넘어간다. 이 함수는 광장 페이지를 서버에서 그릴 때 불리는데,
 * 스키마(forestRecord)는 손으로 적용하므로 '배포는 됐고 SQL 은 아직' 인 순간이 있다.
 * 그때 예외가 올라가면 팻말이 아니라 광장 자체가 안 열린다. 팻말은 비어 있어도 되지만
 * 광장이 닫히면 안 된다.
 */
export async function getForestRecords(map: string, limit = 3): Promise<ForestRecordRow[]> {
  try {
    const rows = await db().select('forestRecord', { map });
    return [...rows]
      .sort((a, b) => a.ms - b.ms)
      .slice(0, limit)
      .map((r) => ({ nickname: r.userNickname, ms: r.ms }));
  } catch (error) {
    console.error('[forestRecord:list]', error);
    return [];
  }
}

/* ================================================================== */
/* 알림 — 기존 데이터에서 파생 (별도 이벤트 테이블 없이)                  */
/* ================================================================== */

export type NotiType =
  | 'board'
  | 'album'
  | 'diary'
  | 'guestbook'
  | 'friendcmt'
  | 'friend'
  | 'fboard'
  | 'falbum'
  | 'fdiary';

export interface NotiItem {
  id: string;
  type: NotiType;
  actor: string;
  text: string;
  /** 정렬·읽음 판정용 ISO */
  date: string;
  dateLabel: string;
  link: string;
  unread: boolean;
}

const NOTI_LIMIT = 30;
/** 계정별로 남겨 두는 "읽음" 기록 수 (알림 목록보다 넉넉하게) */
const NOTI_READ_KEEP = 300;

/** 이 사용자가 읽은 알림 id 들 */
export async function getReadNotiIds(viewer: string): Promise<string[]> {
  const rows = await db().select('notiRead', { userNickname: viewer });
  return rows.map((r) => r.notiId);
}

/**
 * 알림을 읽음으로 표시한다. 이미 읽은 것은 건너뛴다.
 * 읽음 기록은 계정에 남으므로 다른 PC 에서 접속해도 그대로다.
 */
export async function markNotiRead(viewer: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const already = new Set(await getReadNotiIds(viewer));
  const fresh = [...new Set(ids)].filter((id) => id && !already.has(id));
  if (fresh.length === 0) return;

  const now = nowIso();
  await db().insertMany(
    'notiRead',
    fresh.map((notiId) => ({
      userNickname: viewer, notiId, read_date: now,
    })) as Array<Omit<NotiRead, 'seq'>>,
  );

  // 오래된 기록은 정리한다. 알림 목록 자체가 최신 NOTI_LIMIT 개만 보므로
  // 그보다 넉넉한 만큼만 남겨도 "이미 읽은 게 다시 뜨는" 일은 없다.
  const rows = await db().select('notiRead', { userNickname: viewer });
  if (rows.length > NOTI_READ_KEEP) {
    const stale = [...rows]
      .sort((a, b) => (a.read_date < b.read_date ? 1 : a.read_date > b.read_date ? -1 : 0))
      .slice(NOTI_READ_KEEP);
    for (const row of stale) await db().remove('notiRead', { seq: row.seq });
  }
}

/**
 * 로그인한 사용자(viewer)를 대상으로 한 알림 목록.
 * 내 게시판/사진첩/다이어리 댓글, 일촌평, 방명록, 받은 일촌신청을 모아
 * 최신순으로 돌려준다.
 *
 * 이미 읽은 알림(readIds)은 목록에서 아예 빼고 돌려준다.
 * — 읽고 나면 내용까지 사라지는 게 맞다. 예전엔 읽음 표시만 하고 계속 남아 있었다.
 */
export async function getNotifications(
  viewer: string,
  readIds: string[] = [],
): Promise<{ items: NotiItem[]; unread: number }> {
  const seen = new Set(readIds);
  const [myBoards, myAlbums, myDiaries] = await Promise.all([
    db().select('board', { userNickname: viewer }),
    db().select('album', { userNickname: viewer }),
    db().select('diary', { userNickname: viewer }),
  ]);

  const boardTitle = new Map(myBoards.map((b) => [b.seq, b.title]));
  const albumTitle = new Map(myAlbums.map((a) => [a.seq, a.title]));
  const diaryTitle = new Map(myDiaries.map((d) => [d.seq, d.title]));

  const [boardCmts, albumCmts, diaryCmts, friendCmts, visits, friendReqs] = await Promise.all([
    db().selectIn('boardCMT', 'boardSeq', [...boardTitle.keys()]),
    db().selectIn('albumCMT', 'albumSeq', [...albumTitle.keys()]),
    db().selectIn('diaryCMT', 'diarySeq', [...diaryTitle.keys()]),
    db().select('friendCMT', { friendNickname: viewer }),
    db().select('visit', { targetNickname: viewer }),
    db().select('friends', { friendNickname: viewer, fStatus: 0 }),
  ]);

  const clip = (s: string) => (s.length > 20 ? `${s.slice(0, 20)}…` : s);
  const items: NotiItem[] = [];

  for (const c of boardCmts) {
    if (c.userNickname === viewer) continue;
    items.push({
      id: `board-${c.seq}`, type: 'board', actor: c.userNickname, date: c.create_date,
      text: `${c.userNickname}님이 게시글 "${clip(boardTitle.get(c.boardSeq) ?? '')}"에 댓글을 남겼어요`,
      link: `/mnHome/boardDetail/${viewer}/${c.boardSeq}`, dateLabel: '', unread: false,
    });
  }
  for (const c of albumCmts) {
    if (c.userNickname === viewer) continue;
    items.push({
      id: `album-${c.seq}`, type: 'album', actor: c.userNickname, date: c.create_date,
      text: `${c.userNickname}님이 사진 "${clip(albumTitle.get(c.albumSeq) ?? '')}"에 댓글을 남겼어요`,
      link: `/mnHome/albumDetailView/${viewer}/${c.albumSeq}`, dateLabel: '', unread: false,
    });
  }
  for (const c of diaryCmts) {
    if (c.userNickname === viewer) continue;
    items.push({
      id: `diary-${c.seq}`, type: 'diary', actor: c.userNickname, date: c.create_date,
      text: `${c.userNickname}님이 다이어리에 댓글을 남겼어요`,
      link: `/mnHome/diaryView/${viewer}`, dateLabel: '', unread: false,
    });
  }
  for (const c of friendCmts) {
    if (c.userNickname === viewer || c.del_yn.toUpperCase() === 'Y') continue;
    items.push({
      id: `friendcmt-${c.seq}`, type: 'friendcmt', actor: c.userNickname, date: c.createDate,
      text: `${c.userNickname}님이 일촌평을 남겼어요`,
      link: `/mnHome/mainView/${viewer}`, dateLabel: '', unread: false,
    });
  }
  for (const v of visits) {
    if (v.userNickname === viewer) continue;
    items.push({
      id: `guestbook-${v.seq}`, type: 'guestbook', actor: v.userNickname, date: v.create_date,
      text: `${v.userNickname}님이 방명록을 남겼어요`,
      link: `/mnHome/visitView/${viewer}`, dateLabel: '', unread: false,
    });
  }
  for (const f of friendReqs) {
    if (f.del_yn.toUpperCase() === 'Y') continue;
    items.push({
      id: `friend-${f.seq}`, type: 'friend', actor: f.userNickname, date: f.createDate,
      text: `${f.userNickname}님이 일촌을 신청했어요`,
      link: `/mnHome/settingFriends/${viewer}`, dateLabel: '', unread: false,
    });
  }

  /*
   * 일촌(수락된)이 올린 새 콘텐츠 — 게시글 / 사진 / 다이어리.
   *
   * 일촌을 맺기 전에 올라온 글은 알리지 않는다. 예전엔 기준이 없어서 일촌을
   * 맺는 순간 그 사람이 여태 올린 글이 죄다 알림으로 쏟아졌다.
   */
  const friendSince = await getFriendSince(viewer);
  const friendNicks = [...friendSince.keys()];
  if (friendNicks.length > 0) {
    const [fBoards, fAlbums, fDiaries] = await Promise.all([
      db().selectIn('board', 'userNickname', friendNicks),
      db().selectIn('album', 'userNickname', friendNicks),
      db().selectIn('diary', 'userNickname', friendNicks),
    ]);
    // 받는 사람이 일촌이므로 전체공개 + 일촌공개까지 알린다 (나만보기는 제외)
    const friendViewer: Viewer = { isOwner: false, isFriend: true };
    const live = <T extends { del_yn: string; openScope: number }>(r: T) =>
      r.del_yn.toLowerCase() === 'n' && canView(r.openScope, friendViewer);

    /** 일촌을 맺은 뒤에 올라온 글인가 (ISO 표기가 달라질 수 있어 시각으로 비교) */
    const afterFriendship = (r: { userNickname: string; create_date: string }) => {
      const since = friendSince.get(r.userNickname);
      if (!since) return false;
      return new Date(r.create_date).getTime() >= new Date(since).getTime();
    };

    for (const b of fBoards) {
      if (!live(b) || !afterFriendship(b)) continue;
      items.push({
        id: `fboard-${b.seq}`, type: 'fboard', actor: b.userNickname, date: b.create_date,
        text: `${b.userNickname}님이 새 게시글 "${clip(b.title)}"을 올렸어요`,
        link: `/mnHome/boardDetail/${b.userNickname}/${b.seq}`, dateLabel: '', unread: false,
      });
    }
    for (const a of fAlbums) {
      if (!live(a) || !afterFriendship(a)) continue;
      items.push({
        id: `falbum-${a.seq}`, type: 'falbum', actor: a.userNickname, date: a.create_date,
        text: `${a.userNickname}님이 새 사진 "${clip(a.title)}"을 올렸어요`,
        link: `/mnHome/albumDetailView/${a.userNickname}/${a.seq}`, dateLabel: '', unread: false,
      });
    }
    for (const d of fDiaries) {
      if (!live(d) || !afterFriendship(d)) continue;
      items.push({
        id: `fdiary-${d.seq}`, type: 'fdiary', actor: d.userNickname, date: d.create_date,
        text: `${d.userNickname}님이 새 다이어리를 올렸어요`,
        link: `/mnHome/diaryView/${d.userNickname}`, dateLabel: '', unread: false,
      });
    }
  }

  const sorted = items
    .filter((it) => !seen.has(it.id))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, NOTI_LIMIT)
    .map((it) => ({ ...it, dateLabel: ymdhmDot(it.date), unread: true }));

  // 읽은 건 위에서 걸러냈으니 남은 게 전부 안 읽은 알림이다.
  return { items: sorted, unread: sorted.length };
}
