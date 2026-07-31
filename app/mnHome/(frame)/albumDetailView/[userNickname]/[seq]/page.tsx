import { notFound } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import AlbumDetailClient from '@/components/minihome/AlbumDetailClient';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { getSessionUser } from '@/lib/session';
import { friendCheck, getAlbumComments, selectAlbums } from '@/lib/db/repo';
import { ymdhm } from '@/lib/db/format';

/** 구 AlbumController.albumDetailView + views/miniHome/albumDetail.jsp */
export default async function AlbumDetailViewPage({
  params,
}: {
  params: Promise<{ userNickname: string; seq: string }>;
}) {
  const { userNickname: raw, seq } = await params;
  const userNickname = decodeURIComponent(raw);
  const seqNum = Number(seq);
  if (!Number.isFinite(seqNum)) notFound();

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();

  const [album] = await selectAlbums(userNickname, seqNum);
  if (!album) notFound();
  if (!common.isOwner && album.openScope !== 1) notFound();

  const viewer = await getSessionUser();
  const [comments, check] = await Promise.all([
    getAlbumComments(album.seq),
    viewer
      ? viewer.userNickname === userNickname
        ? Promise.resolve(1)
        : friendCheck(viewer.userNickname, userNickname)
      : Promise.resolve(0),
  ]);

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/minihome/album.css', '/resources/css/minihome/board.css']}
      />
      <MiniHomeShell common={common}>
        <AlbumDetailClient
          userNickname={userNickname}
          viewerNickname={viewer?.userNickname ?? ''}
          isOwner={common.isOwner}
          seq={album.seq}
          title={album.title}
          content={album.content}
          writer={album.userNickname}
          createDate={ymdhm(album.create_date)}
          images={album.imagePath.split(',').filter(Boolean)}
          canComment={check === 1}
          comments={comments}
        />
      </MiniHomeShell>
    </>
  );
}
