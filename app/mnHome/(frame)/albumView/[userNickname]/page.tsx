import { notFound } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import AlbumListClient from '@/components/minihome/AlbumListClient';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { selectAlbums } from '@/lib/db/repo';

/** 구 AlbumController.albumView + views/miniHome/album.jsp */
export default async function AlbumViewPage({
  params,
}: {
  params: Promise<{ userNickname: string }>;
}) {
  const { userNickname: raw } = await params;
  const userNickname = decodeURIComponent(raw);

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();

  const albums = await selectAlbums(userNickname);
  // 주인이 아니면 전체공개만 보인다
  const visible = common.isOwner ? albums : albums.filter((a) => a.openScope === 1);

  return (
    <>
      <Stylesheets hrefs={['/resources/css/minihome/album.css']} />
      <MiniHomeShell common={common}>
        <AlbumListClient
          userNickname={userNickname}
          isOwner={common.isOwner}
          list={visible.map((a) => ({
            seq: a.seq,
            title: a.title,
            // imagePath 는 콤마로 이어붙인 목록이라 첫 장만 썸네일로 쓴다
            thumbnail: a.imagePath.split(',')[0] ?? '',
          }))}
        />
      </MiniHomeShell>
    </>
  );
}
