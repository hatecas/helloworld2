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

  // 공개범위(전체공개/일촌공개/나만보기)는 selectAlbums 안에서 걸러진다
  const visible = await selectAlbums(userNickname, common.viewer);

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
