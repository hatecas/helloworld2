import { notFound, redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import AlbumWriteClient from '@/components/minihome/AlbumWriteClient';
import { loadMiniHomeCommon } from '@/lib/minihome';

/** 구 AlbumController.albumWriteView + views/miniHome/albumWrite.jsp */
export default async function AlbumWriteViewPage({
  params,
}: {
  params: Promise<{ userNickname: string }>;
}) {
  const { userNickname: raw } = await params;
  const userNickname = decodeURIComponent(raw);

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();
  if (!common.isOwner) redirect(`/mnHome/albumView/${userNickname}`);

  return (
    <>
      <Stylesheets hrefs={['/resources/css/minihome/album.css']} />
      <MiniHomeShell common={common}>
        <AlbumWriteClient userNickname={userNickname} />
      </MiniHomeShell>
    </>
  );
}
