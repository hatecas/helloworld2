import type { Metadata } from 'next';
import Stylesheets from '@/components/Stylesheets';
import BgmBuyClient from '@/components/store/BgmBuyClient';

export const metadata: Metadata = { title: 'BGM 구매' };

interface SelectedBgm {
  title: string;
  artist: string;
  price: string;
}

/** 구 StoreController.bgmBuy + views/store/bgmBuy.jsp */
export default async function BgmBuyPage({
  searchParams,
}: {
  searchParams: Promise<{ selectedData?: string }>;
}) {
  const { selectedData } = await searchParams;

  let items: SelectedBgm[] = [];
  if (selectedData) {
    try {
      const parsed: unknown = JSON.parse(selectedData);
      if (Array.isArray(parsed)) items = parsed as SelectedBgm[];
    } catch {
      items = [];
    }
  }

  return (
    <>
      <Stylesheets
        hrefs={[
          '/resources/css/index/main.css',
          '/resources/css/index/store.css',
          '/resources/css/index/bgm.css',
          '/resources/css/minihome/fonts.css',
        ]}
      />
      <BgmBuyClient items={items} />
    </>
  );
}
