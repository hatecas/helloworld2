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
                      // 못 불러온 이미지는 한 번만 숨긴다. (src 를 다시 세팅하면
                      // React 합성이벤트라 onError 가 재발동해 무한 요청이 된다)
                      const img = e.currentTarget;
                      if (img.dataset.failed) return;
                      img.dataset.failed = '1';
                      img.style.display = 'none';
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
