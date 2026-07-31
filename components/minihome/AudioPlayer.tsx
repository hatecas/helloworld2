'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface Track {
  title: string;
  contentPath: string;
}

const IMG = '/resources/images/audioPlayer';

/**
 * BGM 플레이어 (구 main.jsp + resources/js/default.js).
 *
 * 미니홈피 레이아웃 바깥(레이아웃 컴포넌트)에 있어서 탭을 옮겨도 언마운트되지 않는다.
 * = 음악이 끊기지 않는다.
 *
 * 예전에는 재생/일시정지 버튼이 따로 있었는데 하나의 토글로 합쳤다.
 * 브라우저 자동재생 정책 때문에 첫 재생은 사용자가 한 번 눌러야 시작될 수 있다.
 */
export default function AudioPlayer({
  playlist,
  autoPlay = false,
}: {
  playlist: Track[];
  /** 내 미니홈피에 들어왔을 때 첫 곡을 자동 재생 (브라우저가 막으면 조용히 정지 상태) */
  autoPlay?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  // autoPlay 를 홈피당 한 번만 시도하기 위한 플래그
  const autoTried = useRef(false);

  const track = playlist[current];
  const empty = playlist.length === 0;

  // 플레이리스트가 바뀌면 첫 곡으로
  useEffect(() => {
    setCurrent(0);
  }, [playlist]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    audio.play().then(
      () => setPlaying(true),
      () => setPlaying(false), // 자동재생이 막히면 조용히 정지 상태로 둔다
    );
  }, [track]);

  // 내 미니홈피면 첫 곡을 자동으로 튼다. 다른 홈피로 갔다 오면 (autoPlay=false)
  // 플래그가 풀려서 내 홈피로 돌아왔을 때 다시 시도한다.
  useEffect(() => {
    if (!autoPlay) {
      autoTried.current = false;
      return;
    }
    if (autoTried.current || empty || !track) return;
    autoTried.current = true;
    play();
  }, [autoPlay, empty, track, play]);

  const toggle = () => {
    if (empty) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      play();
    }
  };

  const move = (delta: number) => {
    if (empty) return;
    setCurrent((i) => (i + delta + playlist.length) % playlist.length);
    setPlaying(true);
  };

  // 곡이 바뀌면 이어서 재생
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    audio.load();
    if (playing) play();
    // playing 을 의존성에 넣으면 일시정지 시에도 load 가 돌아 버린다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.contentPath]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = muted ? 0 : volume / 100;
  }, [muted, volume]);

  return (
    <div className={empty ? 'audioPlayerContainer is-empty' : 'audioPlayerContainer'}>
      <audio
        id="audioElement"
        ref={audioRef}
        preload="auto"
        src={track?.contentPath}
        onEnded={() => move(1)}
      />

      <div className="audioPlayingContainer">
        <div className="audioPlayingDiv">
          {/* 예전 nowPlaying.png(구식 CD) 대신 CSS 로 그린 세련된 바이닐 디스크 */}
          <div
            id="audioPlayingImg"
            className={playing ? 'audioDisc rotating' : 'audioDisc'}
            aria-hidden="true"
          />
        </div>
        <div className="audioPlayingMargin" />
        <div className="nowPlaying">
          <div
            className="audioTitle"
            id="songTitle"
            style={{ animationPlayState: playing ? 'running' : 'paused' }}
            title={track?.title}
          >
            {track?.title ?? '재생목록이 비어 있어요'}
          </div>
        </div>
      </div>

      <div className="audioControlsContainer">
        <div className="audioBtnContainer">
          <button className="audioBtn" id="audioPrev" onClick={() => move(-1)} disabled={empty} title="이전 곡">
            <img src={`${IMG}/audioPrev.png`} alt="이전" />
          </button>
          <button
            className="audioBtn audioBtn-main"
            id="audioPlay"
            onClick={toggle}
            disabled={empty}
            title={playing ? '일시정지' : '재생'}
          >
            <img src={`${IMG}/${playing ? 'audioPause.png' : 'audioPlay.png'}`} alt={playing ? '일시정지' : '재생'} />
          </button>
          <button className="audioBtn" id="audioNext" onClick={() => move(1)} disabled={empty} title="다음 곡">
            <img src={`${IMG}/audioNext.png`} alt="다음" />
          </button>
        </div>

        <div className="audioVolumeContainer">
          <button id="audioVolumeBtn" onClick={() => setMuted((m) => !m)} title="음소거">
            <img
              src={`${IMG}/${muted ? 'audioVolumeMute.png' : 'audioVolume.png'}`}
              alt="음량"
            />
          </button>
          <input
            type="range"
            id="audioVolumeControl"
            min={0}
            max={100}
            step={1}
            value={muted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              setMuted(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
