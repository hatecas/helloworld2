'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { showAlert, showConfirm } from '@/lib/ui/dialog';

/**
 * 퍼가요 버튼 — 일촌의 게시글/사진을 내 미니홈피로 복사한다.
 *
 * 게시글 상세와 사진 상세에서 같이 쓴다. 자격 판정(일촌인지, 볼 수 있는 글인지)은
 * 서버(/mnHome/scrap)가 다시 하므로, 버튼을 감추는 것은 화면 편의일 뿐이다.
 */
export default function ScrapButton({
  kind,
  seq,
  viewerNickname,
  className,
}: {
  kind: 'board' | 'album';
  seq: number;
  /** 퍼간 뒤 내 목록으로 보내 주기 위한 내 닉네임 */
  viewerNickname: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const scrap = async () => {
    if (busy) return;
    if (!(await showConfirm('퍼가시겠습니까?', { confirmText: '예', cancelText: '아니오' }))) return;

    setBusy(true);
    try {
      const res = await fetch('/mnHome/scrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, seq }),
      });
      const json = (await res.json()) as { ok?: boolean; msg?: string };

      if (!json.ok) {
        await showAlert(json.msg ?? '퍼가지 못했습니다.');
        return;
      }

      await showAlert(kind === 'board' ? '내 게시판으로 퍼왔습니다.' : '내 사진첩으로 퍼왔습니다.');
      router.push(
        kind === 'board'
          ? `/mnHome/boardView/${viewerNickname}`
          : `/mnHome/albumView/${viewerNickname}`,
      );
      router.refresh();
    } catch {
      await showAlert('잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={className ? `btn-scrap ${className}` : 'btn-scrap'}
      disabled={busy}
      title="내 미니홈피로 퍼가기"
      onClick={() => void scrap()}
    >
      퍼가요
    </button>
  );
}
