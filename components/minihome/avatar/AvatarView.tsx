import { avatarLayerSrcs, type AvatarParts } from '@/lib/avatar/parts';

/**
 * 아바타 렌더러. 2:3 파트 PNG 를 CSS 로 겹쳐 그린다(픽셀 유지).
 * width 만 주면 높이는 3:2 비율(×1.5)로 자동.
 */
export default function AvatarView({
  parts,
  width = 128,
  className,
}: {
  parts: AvatarParts;
  width?: number;
  className?: string;
}) {
  const srcs = avatarLayerSrcs(parts);
  return (
    <div
      className={className ? `avatar ${className}` : 'avatar'}
      style={{ width, height: width * 1.5 }}
    >
      {srcs.map((src) => (
        <img key={src} src={src} alt="" className="avatar-layer" draggable={false} />
      ))}
    </div>
  );
}
