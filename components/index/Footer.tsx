import Stylesheets from '@/components/Stylesheets';

const YEAR = new Date().getFullYear();

/** 메인 / 공지 / 상점 / 지도 화면 하단 푸터 */
export default function Footer() {
  return (
    <>
      <Stylesheets hrefs={['/resources/css/index/footer.css']} />
      <footer className="footer no-cursor">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">HelloWorld</span>
            <span className="footer-tagline">그때 그 미니홈피, 다시.</span>
          </div>

          <nav className="footer-nav">
            <a href="/store/minimiView">상점</a>
            <a href="/notice/noticeView">공지사항</a>
            <a href="/index/mapView">찾아오는 길</a>
            <a href="/index/member/findId">아이디 찾기</a>
            <a href="/index/member/findPwView">비밀번호 찾기</a>
          </nav>
        </div>

        <div className="footer-bottom">© {YEAR} HelloWorld</div>
      </footer>
    </>
  );
}
