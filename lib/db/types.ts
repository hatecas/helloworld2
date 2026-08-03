/**
 * 구 MyBatis 매퍼(com.core.tjoeun.**.sql.*Mapper.xml)에서 실제로 사용하던
 * 테이블/컬럼을 그대로 옮긴 타입 정의.
 *
 * 주의: 저장소에 있던 src/main/resources/Table_Script 는 매퍼보다 오래된 버전이라
 * friends / friendCMT / bgm / userBgm / miniroom* / miniHomeTitle 등이 빠져 있었다.
 * 여기서는 매퍼 쿼리를 기준으로 재구성했다.
 */

import type { Scope } from './visibility';

export type { Scope };

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
  /** 미니홈피 전체 공개 여부. 0 = 비공개(일촌만 입장), 1 = 공개 */
  homeOpenScope?: 0 | 1;
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
  /** 1 = 전체공개, 2 = 일촌공개, 0 = 나만보기 */
  openScope: Scope;
}

export interface BoardComment {
  seq: number;
  boardSeq: number;
  userNickname: string;
  content: string;
  create_date: string;
  update_date: string;
  openScope: Scope;
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
  openScope: Scope;
}

export interface DiaryComment {
  seq: number;
  diarySeq: number;
  userNickname: string;
  content: string;
  create_date: string;
  openScope: Scope;
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
  openScope: Scope;
}

export interface AlbumComment {
  seq: number;
  albumSeq: number;
  userNickname: string;
  content: string;
  create_date: string;
  update_date: string;
  openScope: Scope;
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
  /** 1 = 전체공개, 2 = 일촌공개, 0 = 비밀글(주인과 작성자만) */
  openScope: Scope;
  /** 미니홈피 주인이 다는 답글 (없으면 null) */
  reply?: string | null;
  reply_date?: string | null;
}

export interface VisitCount {
  seq: number;
  userNickname: string;
  todayCnt: number;
  totalCnt: number;
  /**
   * todayCnt 가 '어느 날' 의 숫자인지 (KST 기준 YYYY-MM-DD).
   * 자정에 리셋해 주는 배치가 없으므로, 이 날짜가 오늘이 아니면 todayCnt 를 0 으로 본다.
   */
  cnt_date?: string;
}

export interface Friend {
  seq: number;
  userNickname: string; // 신청한 쪽
  friendNickname: string; // 받은 쪽
  fStatus: FriendStatus;
  del_yn: YN;
  createDate: string;
  /**
   * 일촌이 된(승인된) 시각. 신청만 해 둔 상태면 없다.
   * 일촌의 새 글 알림을 '맺은 뒤' 것만 보내는 기준이다. (예전에는 기준이 없어서
   * 일촌을 맺으면 그 사람이 과거에 올린 글까지 알림으로 한꺼번에 떴다)
   * 이 컬럼이 생기기 전에 맺은 관계는 비어 있어 createDate 로 대신한다.
   */
  acceptDate?: string | null;
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
  /** '1' = 로그인한 상태 (명시적 로그아웃 전까지) */
  status: '0' | '1';
  /**
   * 마지막 생존 신호 시각(ISO).
   * status 만 보면 브라우저를 닫거나 PC 를 끈 사람이 계속 '접속중'으로 남는다.
   * 실제 '일촌 ON' 판정은 이 값이 최근인지로 한다.
   */
  last_seen?: string;
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

/**
 * 광장 채팅 기록.
 * 실시간 전달은 Supabase Realtime broadcast 가 하고, 이 표는 '지난 대화'를 위해 남긴다.
 * (새로고침하거나 나중에 들어온 사람도 앞의 대화를 볼 수 있어야 한다)
 */
export interface PlazaChat {
  seq: number;
  userNickname: string;
  content: string;
  create_date: string;
}

/**
 * 인내의 숲 등반 기록.
 *
 * 사람마다 맵별로 '가장 빠른 기록' 한 줄만 남긴다. 광장 팻말에 상위 3명을 새기는데,
 * 기록을 다 쌓아 두면 한 사람이 1·2·3등을 다 차지해서 '3명' 이 아니게 된다.
 */
export interface ForestRecord {
  seq: number;
  userNickname: string;
  /** 어느 맵의 기록인지 ('forest' = 인내의 숲, 'forest2' = 숲 깊은 곳) */
  map: string;
  /** 시작 발판을 떠나 정상까지 걸린 시간(ms) */
  ms: number;
  create_date: string;
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
  plazaChat: PlazaChat[];
  forestRecord: ForestRecord[];
}
