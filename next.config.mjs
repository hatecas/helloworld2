/** @type {import('next').NextConfig} */
const nextConfig = {
  // 업로드 이미지는 public/resources/images/download 에 그대로 떨어지므로
  // next/image 최적화를 거치지 않는다. (JSP 시절 경로를 그대로 보존)
  images: {
    unoptimized: true,
  },
  // heic-convert(libheif WASM)는 서버 번들에 넣지 않고 런타임에 그대로 require 한다
  serverExternalPackages: ['heic-convert'],
  // 구버전 JSP URL 을 그대로 살리기 위한 별칭
  async redirects() {
    return [
      { source: '/index/member/home', destination: '/store/dotoriView', permanent: false },
    ];
  },

  /**
   * 구 URL 인 /index/... 를 그대로 쓰기 위한 rewrite.
   *
   * App Router 에서 세그먼트 이름을 그대로 "index" 로 두면 루트 페이지의 빌드 산출물과
   * 이름이 부딪혀 프리렌더가 깨진다(clientReferenceManifest invariant).
   * 그래서 폴더는 app/idx 로 두고, 주소만 /index/... 로 노출한다.
   * 브라우저에 보이는 URL 은 예전 그대로다.
   */
  async rewrites() {
    return [{ source: '/index/:path*', destination: '/idx/:path*' }];
  },
};

export default nextConfig;
