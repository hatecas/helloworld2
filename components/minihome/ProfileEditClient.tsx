'use client';

import { useEffect, useState } from 'react';
import { showAlert } from '@/lib/ui/dialog';

/** views/miniHome/mnhProfileEdit.jsp */
export default function ProfileEditClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <form method="POST" action="/profile/download" encType="multipart/form-data">
      <div className="edit-frame">
        <div className="edit-pad">
          <div className="edit-container-over">
            <div className="edit-file">
              <input
                type="file"
                id="fileInput"
                name="file"
                accept="image/*"
                onChange={(e) => {
                  const picked = e.target.files?.[0] ?? null;
                  if (picked && !picked.type.startsWith('image/')) {
                    void showAlert('이미지 형식의 파일을 업로드해주세요.');
                    e.target.value = '';
                    setFile(null);
                    return;
                  }
                  setFile(picked);
                }}
              />
            </div>
            <div className="file-preview" id="preview-container">
              {preview && (
                <div className="preview-container">
                  <div className="image-container" style={{ textAlign: 'center' }}>
                    <img src={preview} style={{ width: 200, height: 'auto' }} alt="미리보기" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="edit-container-under">
            <div className="edit-introduce">
              <textarea
                id="introduction"
                placeholder="자기소개 문구를 입력하세요"
                rows={3}
                name="msg"
                value={msg}
                onChange={(e) => {
                  const lines = e.target.value.split('\n');
                  if (lines.length > 3) {
                    void showAlert('자기소개는 3줄까지만 입력 가능합니다.');
                    setMsg(lines.slice(0, 3).join('\n'));
                  } else {
                    setMsg(e.target.value);
                  }
                }}
              />
            </div>
          </div>

          <div className="edit-btn">
            <input type="submit" value="등록" id="btnUpload" />
            <input
              type="button"
              value="취소"
              id="cancel-button"
              onClick={() => window.close()}
            />
            <input
              type="hidden"
              id="fileStatus"
              name="fileStatus"
              value={file ? 'hasFile' : 'noFile'}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
