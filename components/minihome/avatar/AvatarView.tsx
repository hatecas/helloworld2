import { CANVAS, CONTENT, avatarLayerSrcs, type AvatarParts } from '@/lib/avatar/parts';

/**
 * 아바타 렌더러 — 같은 캔버스에 그려진 파트 PNG 들을 그대로 겹친다(픽셀 유지).
 *
 * 에셋 캔버스(1024×1536) 는 대부분이 빈 여백이라 통째로 그리면 캐릭터가 작게 나온다.
 * 캐릭터가 실제로 그려진 영역(CONTENT)만 잘라 칸을 꽉 채우도록 확대·이동한다.
 * 모든 레이어에 같은 변환을 걸므로 정렬은 그대로 유지된다.
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

  // 캐릭터 영역이 width 에 딱 맞도록 하는 배율
  const scale = width / CONTENT.w;
  const height = CONTENT.h * scale;

  return (
    <div
      className={className ? `avatar ${className}` : 'avatar'}
      style={{ width, height, overflow: 'hidden' }}
    >
      <div
        className="avatar-frame"
        style={{
          position: 'absolute',
          width: CANVAS.w * scale,
          height: CANVAS.h * scale,
          left: -CONTENT.x * scale,
          top: -CONTENT.y * scale,
        }}
      >
        {srcs.map((src) => (
          <img key={src} src={src} alt="" className="avatar-layer" draggable={false} />
        ))}
      </div>
    </div>
  );
}
