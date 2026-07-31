# 아바타 에셋 제작 규격 (확정본)

레이어드 페이퍼돌 방식 — **민머리·맨몸 베이스** 위에 눈/헤어/옷/모자/악세를 스프라이트로 갈아끼운다.
스타일 레퍼런스: `ref3.png`(완성 캐릭터), `ref2.png`(부위 분리 예시).

## 캔버스 / 그리드
- **도트 작업 단위: 128 × 192** (2:3)
- **실제 파일: 1024 × 1536 PNG, 투명** (도트 1칸 = 8×8px, 즉 ×8)
- 좌표: 좌상단 (0,0), x→오른쪽 / y→아래. 캐릭터 좌우 중앙 = **x 64** (파일 기준 512)
- 모든 파트는 **같은 1024×1536 캔버스**에 **정위치**로 그리고 나머지는 **완전 투명**. (파트 나열 시트 금지 — 한 파일 = 한 부위, 몸에 붙는 자리 그대로)

## 몸 리그 기준선 (도트 그리드 기준 / 모든 파트 이 위치에 맞춤)
- 머리: y **10–86** (중심 64,48), 폭 84 · 눈 라인: y **≈60**
- 목: y 86–92 · 어깨: y **≈92**, 폭 ≈52 (x 38–90)
- 몸통: y 92–140 · 허리: y **≈140**
- 다리: y 140–182 · **발바닥: y ≈188**

## 파트별 픽셀 크기 & 위치 (128×192 그리드 / 괄호 = ×8 실제파일)
| 파트 | 크기(도트) | 위치 | ×8 |
|---|---|---|---|
| 전체 캐릭터 | ~104×180 | 중앙, 발바닥 y≈188 | 832×1440 |
| 머리(베이스) | 84×76 | x22–106, y10–86 (중심 64,48) | 672×608 |
| 눈(한 쌍) | 52×18 | y52–70, 좌동공 x≈52 / 우동공 x≈76 | 416×144 |
| └ 눈 1개 | ~16×14 | 위 라인 좌우 | 128×112 |
| 헤어 | 96×96 (긴머리 96×140) | y2~, x16–112 | 768×768 |
| 상의 | 84×60 | y88–148, x22–106 | 672×480 |
| 하의 | 68×54 | y138–192, x30–98 | 544×432 |
| 신발 | 64×22 | y170–192, x32–96 | 512×176 |
| 모자/헤드웨어 | 96×60 | y0–60, x16–112 | 768×480 |
| 악세(안경 등) | 56×20 | y50–70 | 448×160 |

## 폴더 / 파일명
```
public/resources/images/avatar/
  base/male.png, base/female.png     # 민머리·맨몸·눈 없는 마네킹
  eyes/<id>.png
  hair/<id>.png
  top/<id>.png                       # 상의 (브라 포함)
  bottom/<id>.png                    # 하의 (속옷/치마 포함)
  shoes/<id>.png
  headwear/<id>.png                  # 모자/후드
  acc/<id>.png                       # 안경 등
```
- 옷을 통짜 한 벌로 하고 싶으면 `outfit/<id>.png` 하나로 대체 가능(상의+하의+신발 합침).

## 겹치는 순서 (아래 → 위)
`base → bottom → top → shoes → eyes → hair → headwear → acc`

## 규칙
1. 모든 파트 = 1024×1536 투명, 해당 부위만 위 위치, 나머지 투명.
2. **base(민머리·맨몸·눈없음) 먼저 확정** → 그 위에 각 파트를 정위치로 그려 따로 export(정렬 보장).
3. 안티에일리어싱 금지(도트 또렷하게), 통일된 제한 팔레트.

## 프롬프트
공통 접두어:
> `pixel art, dot art, cute chibi character (big head, ~2 heads tall), front view, standing, clean outline, soft shading, cozy palette, no anti-aliasing, crisp pixels, transparent background, 1024x1536`

- base/female: `+ bald head, NO hair, NO clothes, smooth doll-like body (SFW, no anatomical detail), blank face with faint mouth and NO eyes, centered`
- base/male: `+ 위와 동일, male body shape, same size & position as female base`
- eyes/*: `+ just a pair of pixel eyes at the face eye-line, everything else transparent`
- hair/*: `+ just the hairstyle on the head, transparent elsewhere`
- top/*: `+ just the top garment on torso+arms, transparent elsewhere`
- bottom/*: `+ just the bottom garment on hips+legs, transparent elsewhere`
- shoes/*: `+ just the shoes on the feet, transparent elsewhere`
- headwear/*: `+ just the hat/hood on top of the head, transparent elsewhere`
- acc/*: `+ just the accessory at its spot, transparent elsewhere`
