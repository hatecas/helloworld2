/**
 * 포털 화면(공지 / 상점 / 지도) 상단 헤더.
 *
 * greeting 을 넘긴 화면만 인사말 줄(#divHiUser)을 그린다.
 * 상점은 같은 자리에 하위 탭(StoreTabs)이 들어가고, 공지는 아무것도 없다.
 * (구 JSP 들의 구조와 같다)
 */
export default function IndexHeader({
  loggedIn,
  dotori,
  active,
  greeting,
}: {
  loggedIn: boolean;
  dotori: number | null;
  active?: 'store' | 'notice' | 'map';
  greeting?: string;
}) {
  const cls = (name: 'store' | 'notice' | 'map', base: string) =>
    active === name ? `${base} press-btn` : base;

  return (
    <>
      <div className="divIndexMenu index-header">
        <div className="index-header-left">
          <a className="logoATag" href="/">
            <img
              className="index-header-logo"
              id="loginLogo"
              src="/resources/images/mainLogo.png"
              alt="HelloWorld"
            />
          </a>
        </div>
        <div className="index-header-right">
          {loggedIn && (
            <h5 className="right" id="userDotori">
              <img
                id="indexDotoriImg"
                src="/resources/images/store/storeDotoriIcon.png"
                alt="도토리"
              />
              <span id="userDotoriCnt">{dotori ?? 0}</span>
            </h5>
          )}
          <a href="/store/minimiView" className={cls('store', 'index-a-store')}>
            상점
          </a>
          <a href="/notice/noticeView" className={cls('notice', 'index-a-notice')}>
            공지사항
          </a>
          <a href="/index/mapView" className={cls('map', 'index-a-map')}>
            찾아오는 길
          </a>
          {loggedIn && (
            <a id="linkLogout" href="/index/member/logout" className="index-a-logout">
              로그아웃
            </a>
          )}
        </div>
      </div>

      {greeting && (
        <div id="divHiUser">
          <p className="hello-message" id="helloMessage">
            {greeting}
          </p>
        </div>
      )}
    </>
  );
}
