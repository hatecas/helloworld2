'use client';

import { useRouter } from 'next/navigation';

/** views/miniHome/album.jsp */
export default function AlbumListClient({
  userNickname,
  isOwner,
  list,
}: {
  userNickname: string;
  isOwner: boolean;
  list: Array<{ seq: number; title: string; thumbnail: string }>;
}) {
  const router = useRouter();

  return (
    <>
      {isOwner && (
        <div className="album-submit">
          <input
            type="button"
            className="btnAlbumWrite"
            id="btnUpload"
            value="사진올리기"
            onClick={() => router.push(`/mnHome/albumWriteView/${userNickname}`)}
          />
        </div>
      )}
      <div className="album-overflow">
        <div className="album-container-container">
          {list.length === 0 ? (
            <div id="noneMsg">사진이 없습니다.</div>
          ) : (
            list.map((album) => (
              <div
                className="album-container"
                key={album.seq}
                data-albumdetail={`/mnHome/albumDetailView/${userNickname}/${album.seq}`}
                onClick={() => router.push(`/mnHome/albumDetailView/${userNickname}/${album.seq}`)}
              >
                <div className="album-thumbnail">
                  <img
                    src={`/resources/images/download/${album.thumbnail}`}
                    className="addImage"
                    alt={album.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `/resources/images/album/${album.thumbnail}`;
                    }}
                  />
                </div>
                <div className="album-thumbtitle">{album.title}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
