'use client';

import { useRouter } from 'next/navigation';
import { showAlert, showConfirm } from '@/lib/ui/dialog';

import CommentThread, { type ThreadComment } from '@/components/minihome/CommentThread';

/** views/miniHome/albumDetail.jsp + resources/js/album.js 의 deleteAlbum */
export default function AlbumDetailClient({
  userNickname,
  viewerNickname,
  isOwner,
  seq,
  title,
  content,
  writer,
  createDate,
  images,
  canComment,
  comments,
}: {
  userNickname: string;
  viewerNickname: string;
  isOwner: boolean;
  seq: number;
  title: string;
  content: string;
  writer: string;
  createDate: string;
  images: string[];
  canComment: boolean;
  comments: ThreadComment[];
}) {
  const router = useRouter();

  const addComment = async (text: string, parentSeq: number | null) => {
    try {
      const res = await fetch('/mnHome/albumComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumSeq: String(seq), content: text, parentSeq }),
      });
      const json = (await res.json()) as ThreadComment[];
      return json.length > 0 ? json : null;
    } catch {
      return null;
    }
  };

  const deleteComment = async (commentSeq: number) => {
    try {
      const res = await fetch('/mnHome/albumCommentDelete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seq: commentSeq }),
      });
      return ((await res.json()) as number) === 1;
    } catch {
      return false;
    }
  };

  const deleteAlbum = async () => {
    if (!await showConfirm('정말 삭제하시겠습니까?', { danger: true })) return;
    try {
      await fetch('/mnHome/albumDelete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seq }),
      });
      await showAlert('삭제했습니다.');
      router.push(`/mnHome/albumView/${userNickname}`);
      router.refresh();
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <>
      {isOwner && (
        <div className=" album-submit">
          <input
            type="button"
            className="btnAlbumWrite"
            id="btnUpload"
            value="사진올리기"
            onClick={() => router.push(`/mnHome/albumWriteView/${userNickname}`)}
          />
        </div>
      )}
      <div className="album-overflow">
        <div className="album-container3">
          <div className="album-container2">
            <div className="album-container1">
              <div className="album-title">{title}</div>
              <div className="album-wd">
                <span className="album-writer">{writer}</span>
                <span className="album-date">{createDate}</span>
              </div>
              {images.map((image) => (
                <div className="album-images" key={image}>
                  <img
                    src={`/resources/images/download/${image}`}
                    alt="이미지 설명"
                    onError={(e) => {
                      // 못 불러온 이미지는 한 번만 숨긴다. (src 를 다시 세팅하면
                      // React 합성이벤트라 onError 가 재발동해 무한 요청이 된다)
                      const img = e.currentTarget;
                      if (img.dataset.failed) return;
                      img.dataset.failed = '1';
                      img.style.display = 'none';
                    }}
                  />
                </div>
              ))}
              <div className="album-content">{content}</div>

              <div className="album-comment-section">
                <CommentThread
                  viewerNickname={viewerNickname}
                  canComment={canComment}
                  comments={comments}
                  onAdd={addComment}
                  onDelete={deleteComment}
                />
              </div>
            </div>
            <div className="album-public">
              <div className="album-dropDown" />
            </div>
          </div>
          <div className="album-container-under">
            <div className="album-under">
              <a
                className="album-under-left"
                id="albumView"
                onClick={() => router.push(`/mnHome/albumView/${userNickname}`)}
              >
                목록
              </a>
              {isOwner && (
                <a className="album-under-right" onClick={() => void deleteAlbum()}>
                  삭제
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
