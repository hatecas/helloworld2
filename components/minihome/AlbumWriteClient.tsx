'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { showAlert, showConfirm } from '@/lib/ui/dialog';

/** views/miniHome/albumWrite.jsp + resources/js/album.js (multiFiles / writeAlbum) */
export default function AlbumWriteClient({ userNickname }: { userNickname: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('1');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 미리보기 URL 정리
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const removeFile = async (index: number) => {
    if (!(await showConfirm('선택된 사진을 삭제하시겠습니까?', { danger: true }))) return;
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const writeAlbum = async () => {
    if (files.length <= 0) {
      void showAlert('사진을 첨부해주세요.');
      return;
    }
    if (!title.trim()) {
      void showAlert('제목을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('uploadFile', file));
      formData.append(
        'contents',
        new Blob([JSON.stringify({ title, content, visibility })], { type: 'application/json' }),
      );

      const res = await fetch(`/mnHome/albumWrite/${encodeURIComponent(userNickname)}`, {
        method: 'POST',
        body: formData,
      });
      const json = (await res.json()) as { resultCode: string };

      if (json.resultCode === '1') {
        await showAlert('저장되었습니다.');
        router.push(`/mnHome/albumView/${userNickname}`);
        router.refresh();
      } else {
        void showAlert('잠시 후 다시 시도해주세요.');
      }
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="album-overflow">
      <div className="album-container3">
        <div className="album-write">
          <div className="write-card">
            <input
              type="text"
              className="write-title"
              placeholder="제목을 입력하세요"
              id="albumTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="album-file-row">
            <label className="album-file-btn">
              <input
                type="file"
                name="albumFile"
                ref={fileInputRef}
                multiple
                accept="image/*"
                hidden
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              사진 선택
            </label>
            <span className="album-file-hint">
              {files.length > 0 ? `${files.length}장 선택됨` : '여러 장 선택할 수 있어요'}
            </span>
          </div>

          {previews.length > 0 && (
            <div className="album-thumbs">
              {files.map((file, index) => (
                <div className="album-thumb" key={`${file.name}-${index}`}>
                  <img src={previews[index]} alt={file.name} />
                  <button
                    type="button"
                    className="album-thumb-remove"
                    aria-label="사진 삭제"
                    onClick={() => void removeFile(index)}
                  >
                    ×
                  </button>
                  <span className="album-thumb-name" title={file.name}>
                    {file.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          <textarea
            className="album-content-input"
            placeholder="내용을 입력하세요"
            id="albumContent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="write-scope">
            <span className="write-scope-label">공개설정</span>
            <div className="scope-toggle" role="radiogroup" aria-label="공개설정">
              <button
                type="button"
                role="radio"
                aria-checked={visibility === '1'}
                className={visibility === '1' ? 'scope-opt is-on' : 'scope-opt'}
                onClick={() => setVisibility('1')}
              >
                전체공개
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={visibility === '0'}
                className={visibility === '0' ? 'scope-opt is-on' : 'scope-opt'}
                onClick={() => setVisibility('0')}
              >
                비공개
              </button>
            </div>
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
            <a
              className="album-under-right"
              onClick={() => {
                if (!submitting) void writeAlbum();
              }}
            >
              등록
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
