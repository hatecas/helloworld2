/**
 * 구 JSP 의 <link rel="stylesheet"> 를 그대로 옮기기 위한 헬퍼.
 * public/resources/css 아래 원본 CSS 를 손대지 않고 그대로 쓴다.
 * React 19 가 precedence 를 보고 <head> 로 끌어올리고 중복도 정리해 준다.
 */
export default function Stylesheets({ hrefs }: { hrefs: string[] }) {
  return (
    <>
      {hrefs.map((href) => (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
    </>
  );
}
