'use client';

import Script from 'next/script';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type TextareaHTMLAttributes,
} from 'react';

/**
 * 네이버 SmartEditor2 (public/resources/smarteditor2) 를 그대로 감싼 컴포넌트.
 * 구 JSP 들이 HuskyEZCreator.js 로 하던 초기화를 React 라이프사이클로 옮겼다.
 *
 * SE2 는 jindo 라이브러리를 자체 번들로 갖고 있어 jQuery 의존이 없다.
 * 스크립트 로드가 실패해도 안에 있는 <textarea> 는 그대로 남아 글쓰기가 가능하다.
 */

const SKIN_URI = '/resources/smarteditor2/SmartEditor2Skin.html';

export interface SmartEditorHandle {
  /** 에디터 내용을 textarea 로 밀어 넣고 그 값을 돌려준다 */
  getContent(): string;
}

interface Props extends Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'rows' | 'cols' | 'placeholder'> {
  id?: string;
  name?: string;
  defaultValue?: string;
}

type HuskyEditors = {
  getById: Record<string, { exec: (command: string, args: unknown[]) => void }>;
};

type HuskyGlobal = {
  husky: {
    EZCreator: {
      createInIFrame: (options: {
        oAppRef: unknown[];
        elPlaceHolder: string;
        sSkinURI: string;
        fCreator: string;
        htParams?: Record<string, unknown>;
      }) => void;
    };
  };
};

const SmartEditor = forwardRef<SmartEditorHandle, Props>(function SmartEditor(
  { id = 'txtContent', name = 'content', defaultValue = '', ...textareaProps },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorsRef = useRef<unknown[] | null>(null);
  const [failed, setFailed] = useState(false);

  const init = useCallback(() => {
    const nhn = (window as unknown as { nhn?: HuskyGlobal }).nhn;
    if (!nhn?.husky?.EZCreator) {
      setFailed(true);
      return;
    }
    if (editorsRef.current) return;

    const editors: unknown[] = [];
    editorsRef.current = editors;

    try {
      nhn.husky.EZCreator.createInIFrame({
        oAppRef: editors,
        elPlaceHolder: id,
        sSkinURI: SKIN_URI,
        fCreator: 'createSEditor2',
      });
    } catch (error) {
      console.error('[SmartEditor] 초기화 실패, 기본 textarea 로 대체합니다.', error);
      editorsRef.current = null;
      setFailed(true);
    }
  }, [id]);

  useImperativeHandle(
    ref,
    () => ({
      getContent() {
        const editors = editorsRef.current as unknown as HuskyEditors | null;
        try {
          editors?.getById?.[id]?.exec('UPDATE_CONTENTS_FIELD', []);
        } catch {
          // 에디터가 아직 준비되지 않았으면 textarea 원본 값을 그대로 쓴다
        }
        return textareaRef.current?.value ?? '';
      },
    }),
    [id],
  );

  return (
    <>
      {!failed && (
        <Script
          src="/resources/smarteditor2/js/HuskyEZCreator.js"
          strategy="afterInteractive"
          onReady={init}
          onError={() => setFailed(true)}
        />
      )}
      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        defaultValue={defaultValue}
        {...textareaProps}
      />
    </>
  );
});

export default SmartEditor;
