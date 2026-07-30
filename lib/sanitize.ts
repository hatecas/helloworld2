import sanitizeHtml from 'sanitize-html';

/**
 * SmartEditor2 로 작성한 본문(게시판 / 다이어리 / 공지)을 정리한다.
 *
 * 이 본문들은 화면에서 dangerouslySetInnerHTML 로 그대로 렌더링되므로,
 * 아무 태그나 통과시키면 남의 미니홈피에 스크립트를 심을 수 있다.
 * (구 프로젝트는 검사 없이 그대로 저장·출력했다)
 *
 * 저장 시점에 한 번 걸러서 DB 에는 안전한 HTML 만 들어가게 한다.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'div', 'span', 'br', 'hr',
      'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'sub', 'sup', 'mark', 'small',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
      'a', 'img', 'figure', 'figcaption',
      'font', 'center',
    ],
    allowedAttributes: {
      '*': ['style', 'align', 'title', 'class'],
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      font: ['color', 'size', 'face'],
      table: ['border', 'cellpadding', 'cellspacing', 'width'],
      td: ['colspan', 'rowspan', 'width', 'height'],
      th: ['colspan', 'rowspan', 'width', 'height'],
      col: ['width', 'span'],
    },
    // SE2 가 쓰는 인라인 스타일만 남긴다
    allowedStyles: {
      '*': {
        color: [/^.*$/],
        'background-color': [/^.*$/],
        'font-size': [/^.*$/],
        'font-family': [/^.*$/],
        'font-weight': [/^.*$/],
        'font-style': [/^.*$/],
        'text-align': [/^(left|right|center|justify)$/],
        'text-decoration': [/^.*$/],
        'line-height': [/^.*$/],
        width: [/^.*$/],
        height: [/^.*$/],
        margin: [/^.*$/],
        padding: [/^.*$/],
      },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // 상대경로(/resources/images/download/...) 업로드 이미지를 허용해야 한다
    allowProtocolRelative: false,
    transformTags: {
      // 외부 링크는 새 창 + 탭내빙(tabnabbing) 방지
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.href?.startsWith('http')
          ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' }
          : attribs,
      }),
    },
  });
}

/**
 * 방명록·자기소개처럼 평문으로 받아 놓고 화면에서는 개행만 <br> 로 바꿔
 * HTML 로 출력하는 값들. 태그를 전부 제거하고 특수문자는 엔티티로 남긴다.
 * (엔티티 그대로 두어야 렌더링 시 원래 글자로 보인다)
 */
export function sanitizePlainText(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
}
