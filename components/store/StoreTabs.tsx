/** 상점 하위 탭 (미니미 / 스킨 / 메뉴 / 도토리 / bgm) */
export default function StoreTabs({
  active,
}: {
  active: 'minimi' | 'skin' | 'menu' | 'dotori' | 'bgm';
}) {
  const cls = (name: typeof active) => (active === name ? 'storeAtag present' : 'storeAtag');
  return (
    <div id="divHiUser">
      <a className={cls('minimi')} href="/store/minimiView">
        미니미
      </a>
      <a className={cls('skin')} href="/store/skinView">
        스킨
      </a>
      <a className={cls('menu')} href="/store/menuView">
        메뉴
      </a>
      <a className={cls('dotori')} href="/store/dotoriView">
        도토리
      </a>
      <a className={cls('bgm')} href="/store/bgmView">
        bgm
      </a>
    </div>
  );
}
