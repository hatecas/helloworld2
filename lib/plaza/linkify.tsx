import type { ReactNode } from 'react';

/**
 * 채팅 속 URL 을 링크로 바꾼다.
 *
 * 문자열을 그대로 innerHTML 에 넣지 않고 조각으로 잘라 React 노드로 만든다.
 * (React 가 텍스트를 이스케이프하므로 태그가 섞여 들어와도 그대로 글자로 보인다)
 *
 * http/https 만 링크로 만든다. javascript: 같은 스킴은 절대 걸지 않는다.
 */
const URL_RE = /(https?:\/\/[^\s<>()[\]{}"']+|www\.[^\s<>()[\]{}"']+)/gi;

/** 끝에 붙은 문장부호는 링크에서 뺀다 ("...google.com." 같은 경우) */
function trimTrailing(raw: string): { url: string; tail: string } {
  const m = /[.,!?;:)\]}]+$/.exec(raw);
  if (!m) return { url: raw, tail: '' };
  return { url: raw.slice(0, m.index), tail: raw.slice(m.index) };
}

export function linkify(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const match of text.matchAll(URL_RE)) {
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));

    const { url, tail } = trimTrailing(match[0]);
    // www. 로 시작하면 스킴을 붙여 준다
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;

    out.push(
      <a
        key={`l${key++}`}
        className="pz-link"
        href={href}
        target="_blank"
        // 새 창이 원래 창을 건드리지 못하게 + 리퍼러를 넘기지 않는다
        rel="noopener noreferrer nofollow"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>,
    );
    if (tail) out.push(tail);
    last = start + match[0].length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out.length > 0 ? out : [text];
}
