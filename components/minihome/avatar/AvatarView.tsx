import { avatarLayerSrcs, type AvatarParts } from '@/lib/avatar/parts';

/**
 * 아바타 렌더러. 64×64 파트 PNG 를 CSS 로 겹쳐 그린다(픽셀 유지).
 * 에디터 미리보기 · 프로필 · 광장 어디서나 재사용.
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
  const srcs = avatarLayerSrcs(parts);
  return (
    <div
      className={className ? `avatar ${className}` : 'avatar'}
      style={{ width: size, height: size }}
    >
      {srcs.map((src) => (
        <img key={src} src={src} alt="" className="avatar-layer" draggable={false} />
      ))}
    </div>
  );
}
