'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { showAlert } from '@/lib/ui/dialog';
import { toUploadableImage } from '@/lib/heic';

/**
 * 자체 경량 리치텍스트 에디터.
 *
 * 네이버 SmartEditor2 를 걷어내고, 외부 의존성 없이 contentEditable 로 새로 구현했다.
 * 굵게/기울임/밑줄/취소선 · 글자 크기 · 글자색 · 형광펜 · 정렬 · 목록 · 링크 · 이미지.
 *
 * 기존 SmartEditor 와 동일한 { getContent(): string } 핸들을 노출해 글쓰기 로직을
 * 그대로 재사용한다. 본문은 서버(sanitizeRichText)에서 한 번 더 정리된다.
 */

export interface RichTextEditorHandle {
  getContent(): string;
}

interface Props {
  id?: string;
  defaultValue?: string;
  placeholder?: string;
}

/** contentEditable 안에서 서식 명령 실행 (레거시 execCommand — 모든 브라우저에서 동작) */
function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

const FONT_SIZES: Array<{ label: string; value: string }> = [
  { label: '작게', value: '2' },
  { label: '보통', value: '3' },
  { label: '크게', value: '5' },
  { label: '아주 크게', value: '6' },
];

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(function RichTextEditor(
  { id = 'txtContent', defaultValue = '', placeholder = '내용을 입력하세요…' },
  ref,
) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [empty, setEmpty] = useState(!defaultValue.replace(/<[^>]*>/g, '').trim());

  // 초기 내용은 마운트 시 한 번만 주입한다 (제어 컴포넌트가 아니라 커서가 튀지 않는다)
  useEffect(() => {
    if (bodyRef.current && defaultValue) {
      bodyRef.current.innerHTML = defaultValue;
      setEmpty(false);
    }
  }, [defaultValue]);

  useImperativeHandle(
    ref,
    () => ({
      getContent() {
        return bodyRef.current?.innerHTML ?? '';
      },
    }),
    [],
  );

  const syncEmpty = useCallback(() => {
    const html = bodyRef.current?.innerHTML ?? '';
    setEmpty(!html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim());
  }, []);

  // 툴바 버튼을 누를 때 편집 영역의 선택 영역을 잃지 않도록 focus 를 유지한다
  const run = (command: string, value?: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    bodyRef.current?.focus();
    exec(command, value);
    syncEmpty();
  };

  const pickColor = (command: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    bodyRef.current?.focus();
    exec(command, e.target.value);
    syncEmpty();
  };

  const addLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = window.prompt('링크 주소를 입력하세요', 'https://');
    if (!url) return;
    bodyRef.current?.focus();
    exec('createLink', url);
    syncEmpty();
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    try {
      // 아이폰 HEIC 는 JPEG 로 변환해 올린다 (서버에도 안전망이 있지만 업로드 크기도 줄여준다)
      const file = await toUploadableImage(picked);
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/mnHome/uploadImage', { method: 'POST', body: form });
      const json = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !json.url) {
        void showAlert(json.message ?? '이미지 업로드에 실패했습니다.');
        return;
      }
      bodyRef.current?.focus();
      exec('insertImage', json.url);
      syncEmpty();
    } catch {
      void showAlert('이미지 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="rte">
      <div className="rte-toolbar" role="toolbar" aria-label="서식 도구">
        <div className="rte-group">
          <button type="button" className="rte-btn" title="굵게" onMouseDown={run('bold')}>
            <b>B</b>
          </button>
          <button type="button" className="rte-btn" title="기울임" onMouseDown={run('italic')}>
            <i>I</i>
          </button>
          <button type="button" className="rte-btn" title="밑줄" onMouseDown={run('underline')}>
            <u>U</u>
          </button>
          <button type="button" className="rte-btn" title="취소선" onMouseDown={run('strikeThrough')}>
            <s>S</s>
          </button>
        </div>

        <div className="rte-group">
          <select
            className="rte-select"
            title="글자 크기"
            defaultValue="3"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              bodyRef.current?.focus();
              exec('fontSize', e.target.value);
            }}
          >
            {FONT_SIZES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <label className="rte-btn rte-color" title="글자색">
            <span className="rte-color-swatch" style={{ color: '#111' }}>
              가
            </span>
            <input type="color" defaultValue="#111111" onChange={pickColor('foreColor')} />
          </label>

          <label className="rte-btn rte-color" title="형광펜">
            <span className="rte-color-swatch rte-color-hi">가</span>
            <input type="color" defaultValue="#ffe14d" onChange={pickColor('hiliteColor')} />
          </label>
        </div>

        <div className="rte-group">
          <button type="button" className="rte-btn" title="왼쪽 정렬" onMouseDown={run('justifyLeft')}>
            ≣
          </button>
          <button type="button" className="rte-btn" title="가운데 정렬" onMouseDown={run('justifyCenter')}>
            ≡
          </button>
          <button type="button" className="rte-btn" title="오른쪽 정렬" onMouseDown={run('justifyRight')}>
            ≣
          </button>
        </div>

        <div className="rte-group">
          <button
            type="button"
            className="rte-btn"
            title="글머리 기호"
            onMouseDown={run('insertUnorderedList')}
          >
            •≡
          </button>
          <button
            type="button"
            className="rte-btn"
            title="번호 목록"
            onMouseDown={run('insertOrderedList')}
          >
            1≡
          </button>
        </div>

        <div className="rte-group">
          <button type="button" className="rte-btn" title="링크" onMouseDown={addLink}>
            🔗
          </button>
          <button
            type="button"
            className="rte-btn"
            title="이미지"
            onMouseDown={(e) => {
              e.preventDefault();
              fileRef.current?.click();
            }}
          >
            🖼
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.heic,.heif"
            hidden
            onChange={(e) => void onPickImage(e)}
          />
        </div>
      </div>

      <div
        ref={bodyRef}
        id={id}
        className={empty ? 'rte-body is-empty' : 'rte-body'}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={syncEmpty}
        onBlur={syncEmpty}
      />
    </div>
  );
});

export default RichTextEditor;
