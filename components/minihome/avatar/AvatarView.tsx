import { avatarLayers, type AvatarParts } from '@/lib/avatar/parts';

/**
 * 아바타 렌더러. 파트 레이어를 하나의 픽셀 SVG 로 겹쳐 그린다.
 * 어디서나(에디터 미리보기 · 프로필 · 나중에 광장) 재사용한다.
 */
export default function AvatarView({
  parts,
  size = 128,
  className,
}: {
  parts: AvatarParts;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 1.5}
      viewBox="0 0 32 48"
      shapeRendering="crispEdges"
      role="img"
      aria-label="아바타"
    >
      {avatarLayers(parts)}
    </svg>
  );
}
