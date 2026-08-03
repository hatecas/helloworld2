/**
 * 퍼가요 — 일촌의 게시글/사진을 내 미니홈피로 복사하는 기능.
 *
 * 퍼온 글에는 맨 위에 "퍼가요~♡" 표시가 붙는다. 표시를 위한 컬럼을 따로 두지 않고
 * 본문 맨 앞에 넣어 둔다. 게시글 본문은 HTML 이라 문단 하나로, 사진첩 설명은
 * 평문이라 첫 줄로 들어간다. (다이어리는 퍼가기 대상이 아니다)
 */

export const SCRAP_MARK = '퍼가요~♡';

const SCRAP_HTML_MARK = `<p class="scrap-mark">${SCRAP_MARK}</p>`;

/** 게시글(HTML) 본문 맨 앞에 표시를 붙인다 */
export function markScrapHtml(html: string): string {
  // 퍼온 글을 또 퍼가도 표시는 하나만 (여러 줄로 쌓이지 않게)
  if (html.startsWith(SCRAP_HTML_MARK)) return html;
  return `${SCRAP_HTML_MARK}${html}`;
}

/** 사진첩 설명(평문) 첫 줄에 표시를 붙인다 */
export function markScrapText(text: string): string {
  if (text.startsWith(SCRAP_MARK)) return text;
  return text.trim() ? `${SCRAP_MARK}\n${text}` : SCRAP_MARK;
}

/**
 * 평문 본문에서 퍼가요 표시를 떼어 낸다.
 * 사진첩은 설명이 사진 아래에 있어서, 표시는 화면 맨 위에 따로 그려야 한다.
 */
export function splitScrapText(text: string): { scrapped: boolean; body: string } {
  if (!text.startsWith(SCRAP_MARK)) return { scrapped: false, body: text };
  return { scrapped: true, body: text.slice(SCRAP_MARK.length).replace(/^\r?\n/, '') };
}
