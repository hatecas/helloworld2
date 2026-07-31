/**
 * 미니홈피 내부 서브 창(미니룸 편집 · 미니미 변경 · 프로필 편집 등) 열기.
 *
 * 데스크톱: 예전처럼 크기를 지정한 팝업.
 * 모바일/터치: 고정 크기 팝업은 화면을 넘치고 차단되기 쉬우므로 **새 탭(전체화면)**으로 연다.
 *   `_blank` 새 탭은 window.opener 가 유지되므로, 창이 닫힐 때 부모를 부르는 기존
 *   콜백(onChildButtonClick / quickSetting / reloadParentWindow)이 그대로 동작한다.
 */
export function openMiniPopup(url: string, features: string): Window | null {
  const isMobile =
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches);
  return window.open(url, '_blank', isMobile ? undefined : features);
}
