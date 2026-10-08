import { notFound } from 'next/navigation';
import Tab from './Tab';
import { PATH_TABS, TAB_META, TAB_SLUGS } from '@/lib/tabs';

// Prerendered at build time, so these tabs add no serverless functions.
export const dynamicParams = false;

export function generateStaticParams() {
  return TAB_SLUGS.map((tab) => ({ tab }));
}

export function generateMetadata({ params }) {
  const meta = TAB_META[params.tab];
  if (!meta) return {};
  const [title, description] = meta;
  const url = `https://www.laskalegacy.co.za/${params.tab}`;
  return {
    title: `Laska Legacy | ${title}`,
    description,
    alternates: { canonical: url },
    openGraph: { title: `Laska Legacy | ${title}`, description, url, type: 'website' },
  };
}

export default function TabPage({ params }) {
  const page = PATH_TABS[`/${params.tab}`];
  if (!page) notFound();
  return <Tab page={page} />;
}
