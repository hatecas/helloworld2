# 아바타 에셋 제작 규격

민머리·속옷 차림의 **base** 위에 눈/헤어/옷/신발/모자/악세를 갈아끼우는 레이어드 페이퍼돌.

> **핵심 규칙 한 줄**
> 모든 파트를 **같은 1024×1536 캔버스에, 몸에 붙을 자리 그대로** 그리고 나머지는 완전 투명.
> 그러면 그냥 겹치기만 하면 정렬이 맞고, 코드에 위치 계산이 필요 없다.

## 확정 사항

| 항목 | 값 | 이유 |
|---|---|---|
| 캔버스 | **1024 × 1536** (2:3), 투명 PNG | base.png 실측값 |
| 체형 | **유니섹스 1종** | 남녀로 나누면 옷을 전부 두 벌씩 그려야 한다 |
| 피부색 | **1종으로 시작** | 나중에 base 만 몇 장 더 만들면 확장된다 |
| 속옷 | **base 에 포함** | 아무것도 안 입혀도 멀쩡하게 보여야 한다 |
| 눈 | **base 에 없음** (갈아끼우는 파트) | |
| 코·입·귀 | **base 에 있음** | |

## 만드는 순서 — 이 순서를 어기면 반드시 어긋난다

1. **base 를 먼저 확정한다.** 이게 모든 좌표의 기준이다.
2. base 를 **깔아놓고 그 위에** 파트를 그린다.
3. **base 레이어만 끄고** 그 파트만 export 한다.
4. `npm run avatar:check` 로 정렬을 확인한다.

> 초기 에셋 3장이 이 순서를 건너뛰고 파트부터 만들어서, 문서 규격과 전혀 다른 자리에
> 그려져 있었다. 눈대중으로는 절대 안 맞는다.

## 기준선 — `base/base.png` 실측값 (확정)

| 기준 | y |
|---|---|
| 머리 끝 | **479** |
| 눈 라인 | **663 – 711** |
| 목 | **776** |
| 어깨 | **821** |
| 허리 | **914** |
| 발목 | **975** |
| 발바닥 | **1007** |

- 좌우 중심은 항상 **x = 512**
- 캐릭터가 그려진 영역: x **313 – 708**, y **479 – 1007** (396 × 529)
- 머리가 전체의 56% (약 1.8등신)

캔버스 대부분이 빈 여백이라, 화면에 그릴 때는 위 영역만 잘라 꽉 채운다(`AvatarView`).
그러니 **여백을 줄이려고 캐릭터를 옮기지 말 것** — 옮기면 모든 파트가 어긋난다.

## 작업 방법 (이대로만 하면 됩니다)

1. `_guide.png` 를 그림 도구에서 연다 — base 위에 기준선이 그려져 있다
2. **새 레이어**를 만들고 그 위에 파트를 그린다
3. **가이드 레이어를 끄고** 그 파트 레이어만 PNG 로 export (1024×1536, 배경 투명)
4. 해당 폴더에 넣고 `npm run avatar:check` 로 확인

## 폴더

```
public/resources/images/avatar/
  base/base.png        # 민머리·눈 없음·코/입/귀 있음·속옷만 (완료)
  _guide.png           # base + 기준선. 파트 그릴 때 밑에 깔 것 (npm run avatar:guide)
  eyes/<id>.png
  hair/<id>.png
  top/<id>.png         # 상의 (후드 달린 옷이라도 후드는 headwear 로 분리)
  bottom/<id>.png      # 하의
  shoes/<id>.png
  headwear/<id>.png    # 모자·후드·머리를 덮는 것 전부
  acc/<id>.png         # 안경 등
```

파일을 추가하면 `lib/avatar/parts.tsx` 의 `CATALOG` 에 한 줄 등록한다.

## 겹치는 순서 (아래 → 위)

```
base → bottom → top → shoes → eyes → hair → headwear → acc
```

- **eyes 가 hair 보다 아래** — 그래야 앞머리가 눈을 덮는다.
  (예전 코드는 반대라 앞머리 있는 헤어를 넣으면 눈이 머리카락 위로 떴다)
- **머리를 덮는 것은 전부 headwear** — 후드·비니·머리띠. `top` 에 후드를 포함시키면
  헤어보다 위로 올려야 해서 순서가 꼬인다.

## 그리기 규칙

1. 캔버스 1024×1536 투명, 해당 부위만 제자리에, 나머지는 완전 투명.
   **파트를 여러 개 나열한 시트 금지** — 한 파일 = 한 부위.
2. 안티에일리어싱 금지(도트가 또렷해야 한다), 통일된 제한 팔레트.
3. 상의는 base 의 팔을 덮는다는 전제로 그린다. 반팔이면 팔 아래쪽에 base 살색이 보인다.

## 생성 프롬프트

공통 접두어:

```
pixel art, dot art, cute chibi character, about 2 heads tall,
front view, standing straight, clean outline, soft shading,
cozy limited palette, no anti-aliasing, crisp pixels,
transparent background, centered, 1024x1536
```

- **base**: `+ bald head with NO hair, NO eyes, only a small nose, small mouth and ears, wearing plain white underwear only (SFW, no anatomical detail), neutral skin tone, arms slightly apart from body`
- **eyes**: `+ just a pair of pixel eyes at the face eye-line, everything else transparent`
- **hair**: `+ just the hairstyle on the head, transparent elsewhere`
- **top**: `+ just the top garment on torso and arms, transparent elsewhere`
- **bottom**: `+ just the bottom garment on hips and legs, transparent elsewhere`
- **shoes**: `+ just the shoes on the feet, transparent elsewhere`
- **headwear**: `+ just the hat or hood on top of the head, transparent elsewhere`
- **acc**: `+ just the accessory at its spot, transparent elsewhere`

> 파트를 **따로따로** 생성하면 정렬이 거의 안 맞는다. base 이미지를 깔고 그 위에
> 인페인팅으로 얹은 뒤 base 를 지워서 내보내는 방식이 가장 확실하다.
