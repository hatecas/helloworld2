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
        <div className="album-container2">
          <div className="album-container1">
            <div className="album-title albumWrite-title">
              <input
                type="text"
                placeholder="제목을 입력하세요"
                id="albumTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="album-content albumWrite-content">
              <input
                type="file"
                name="albumFile"
                ref={fileInputRef}
                className="albumWirte-file fileupload"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              <div id="preview-container">
                {files.map((file, index) => (
                  <div
                    className="image-container"
                    key={`${file.name}-${index}`}
                    style={{ position: 'relative' }}
                  >
                    <div className="name-container">{file.name}</div>
                    <button
                      className="removeBtn"
                      style={{ position: 'absolute', top: 0, right: 0 }}
                      onClick={() => removeFile(index)}
                    />
                    <img
                      src={previews[index]}
                      alt={file.name}
                      style={{ width: '50%', height: 'auto', marginBottom: 20 }}
                    />
                  </div>
                ))}
              </div>
              <textarea
                placeholder="내용을 입력하세요"
                id="albumContent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>

          <div className="album-public">
            <div className="album-dropDown">
              <span>공개설정 :</span>
              <select
                id="visibilitySelect"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="0">비공개</option>
                <option value="1">전체공개</option>
              </select>
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
