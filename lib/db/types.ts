/**
 * 구 MyBatis 매퍼(com.core.tjoeun.**.sql.*Mapper.xml)에서 실제로 사용하던
 * 테이블/컬럼을 그대로 옮긴 타입 정의.
 *
 * 주의: 저장소에 있던 src/main/resources/Table_Script 는 매퍼보다 오래된 버전이라
 * friends / friendCMT / bgm / userBgm / miniroom* / miniHomeTitle 등이 빠져 있었다.
 * 여기서는 매퍼 쿼리를 기준으로 재구성했다.
 */

export type YN = 'Y' | 'N' | 'y' | 'n';

/** 0 = 대기, 1 = 승인, -1 = 거절 */
export type FriendStatus = 0 | 1 | -1;

export interface User {
  userEmail: string;
  userPassword: string; // SHA-256 hex
  userName: string;
  userNickname: string;
  userGender: 'M' | 'F';
  userBirth: string; // YYYY-MM-DD
  userPhone: string;
  createDate: string; // ISO
  userAvailable: YN;
}

export interface Dotori {
  userNickname: string;
  currentDotori: number;
}

export interface DotoriCharge {
  seq: number;
  userNickname: string;
  dotoriCharge: number;
  dotoriChargeDate: string;
  dotoriChargeMethod: string;
  dotoriPrice: string;
}

export interface DotoriUse {
  seq: number;
  userNickname: string;
  dotoriUse: number;
  dotoriUseFor: string; // "미니미구매-스타픽시" 형태
  dotoriUseDate: string;
}

export type StorageCategory = 'minimi' | 'skin' | 'menu';

export interface UserStorage {
  seq: number;
  userNickname: string;
  category: StorageCategory;
  productName: string;
  contentPath: string;
  buy_date: string;
  /** 1 = 현재 적용중 */
  allocation: 0 | 1;
}

export interface StoreItem {
  seq: number;
  category: StorageCategory;
  productName: string;
  contentPath: string;
  productPrice: string;
}

export interface Bgm {
  seq: number;
  title: string;
  artist: string;
  runningTime: string;
  bgmPrice: string;
  contentPath: string;
}

export interface UserBgm {
  seq: number;
  userNickname: string;
  title: string;
  artist: string;
  runningTime: string;
  contentPath: string;
  allocation: 0 | 1;
}

export interface Profile {
  seq: number;
  userNickname: string;
  /** 파일명 또는 'noneFile' */
  image: string;
  msg: string;
  create_date: string;
  update_date: string;
}

export interface MiniHomeTitle {
  seq: number;
  userNickname: string;
  title: string;
  update_date: string;
}

export interface MiniroomBackground {
  userNickname: string;
  backgroundName: string;
  backgroundPath: string;
}

export interface MiniroomMinimi {
  seq: number;
  userNickname: string;
  minimiName: string;
  minimiPath: string;
  minimiLeft: string; // "390px"
  minimiTop: string; // "163px"
}

export interface Notice {
  seq: number;
  writer: string;
  title: string;
  content: string;
  create_date: string;
  update_date: string;
  del_yn: YN;
}

export interface Board {
  seq: number;
  userNickname: string;
  title: string;
  content: string;
  imagePath: string;
  hits: number;
  create_date: string;
  update_date: string;
  del_yn: YN;
  /** 1 = 전체공개, 0 = 비공개 */
  openScope: 0 | 1;
}

export interface BoardComment {
  seq: number;
  boardSeq: number;
  userNickname: string;
  content: string;
  create_date: string;
  update_date: string;
  openScope: 0 | 1;
  /** 답글이면 부모 댓글의 seq, 원댓글이면 null */
  parentSeq?: number | null;
}

export interface Diary {
  seq: number;
  userNickname: string;
  title: string;
  content: string;
  hits: number;
  create_date: string;
  update_date: string;
  /** 다이어리가 가리키는 날짜 (YYYY-MM-DD) */
  diary_date: string;
  del_yn: YN;
  openScope: 0 | 1;
}

export interface DiaryComment {
  seq: number;
  diarySeq: number;
  userNickname: string;
  content: string;
  create_date: string;
  openScope: 0 | 1;
  /** 답글이면 부모 댓글의 seq, 원댓글이면 null */
  parentSeq?: number | null;
}

export interface Album {
  seq: number;
  userNickname: string;
  title: string;
  content: string;
  /** 콤마로 구분된 파일명 목록 */
  imagePath: string;
  create_date: string;
  update_date: string;
  del_yn: YN;
  openScope: 0 | 1;
}

export interface AlbumComment {
  seq: number;
  albumSeq: number;
  userNickname: string;
  content: string;
  create_date: string;
  update_date: string;
  openScope: 0 | 1;
  /** 답글이면 부모 댓글의 seq, 원댓글이면 null */
  parentSeq?: number | null;
}

export interface Visit {
  seq: number;
  userNickname: string;
  targetNickname: string;
  content: string;
  create_date: string;
  update_date: string;
  /** 미니홈피 주인이 다는 답글 (없으면 null) */
  reply?: string | null;
  reply_date?: string | null;
}

export interface VisitCount {
  seq: number;
  userNickname: string;
  todayCnt: number;
  totalCnt: number;
}

export interface Friend {
  seq: number;
  userNickname: string; // 신청한 쪽
  friendNickname: string; // 받은 쪽
  fStatus: FriendStatus;
  del_yn: YN;
  createDate: string;
}

export interface FriendComment {
  seq: number;
  userNickname: string; // 작성자
  friendNickname: string; // 일촌평이 달린 홈피 주인
  content: string;
  createDate: string;
  del_yn: YN;
}

export interface LoginStatus {
  seq: number;
  userNickname: string;
  /** '1' = 접속중 */
  status: '0' | '1';
}

export interface LoginLog {
  seq: number;
  userNickname: string;
  logDate: string;
}

/**
 * 읽은 알림. 알림 자체는 기존 테이블에서 파생하므로 "읽었다"는 사실만 남긴다.
 * (예전엔 httpOnly 쿠키에 뒀는데 브라우저마다 따로라 다른 PC 에서 다시 안 읽음으로 떴다)
 */
export interface NotiRead {
  seq: number;
  userNickname: string;
  /** getNotifications 가 만드는 알림 id (예: 'board-12') */
  notiId: string;
  read_date: string;
}

/** 인메모리/Supabase 어댑터가 공유하는 전체 데이터 형태 */
export interface Database {
  user: User[];
  dotori: Dotori[];
  dotoriC: DotoriCharge[];
  dotoriU: DotoriUse[];
  userStorage: UserStorage[];
  store: StoreItem[];
  bgm: Bgm[];
  userBgm: UserBgm[];
  profile: Profile[];
  miniHomeTitle: MiniHomeTitle[];
  miniroomBackground: MiniroomBackground[];
  miniroomMinimi: MiniroomMinimi[];
  notice: Notice[];
  board: Board[];
  boardCMT: BoardComment[];
  diary: Diary[];
  diaryCMT: DiaryComment[];
  album: Album[];
  albumCMT: AlbumComment[];
  visit: Visit[];
  visitCnt: VisitCount[];
  friends: Friend[];
  friendCMT: FriendComment[];
  loginStatus: LoginStatus[];
  loginLog: LoginLog[];
  notiRead: NotiRead[];
}
