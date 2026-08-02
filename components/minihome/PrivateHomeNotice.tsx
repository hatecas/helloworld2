import type { MiniHomeCommon } from '@/lib/minihome-view';

/**
 * 비공개로 설정된 미니홈피에 일촌이 아닌 사람이 들어왔을 때 내용 대신 보이는 안내.
 *
 * 어떤 탭으로 들어와도 MiniHomeShell 이 여기로 바꿔치므로,
 * 다이어리·사진첩·게시판·방명록 어느 쪽으로도 새어 나가지 않는다.
 */
export default function PrivateHomeNotice({ common }: { common: MiniHomeCommon }) {
  return (
    <div className="private-home">
      <div className="private-home-lock" aria-hidden="true">
        🔒
      </div>
      <div className="private-home-title">일촌만 볼 수 있는 미니홈피예요</div>
      <p className="private-home-desc">
        <b>{common.userName}</b>님이 홈피를 비공개로 설정했습니다.
        <br />
        일촌이 되면 다이어리 · 사진첩 · 게시판 · 방명록을 볼 수 있어요.
      </p>
      {common.canRequestFriend && (
        <p className="private-home-hint">왼쪽의 🌳 일촌신청 버튼으로 신청할 수 있습니다.</p>
      )}
    </div>
  );
}
