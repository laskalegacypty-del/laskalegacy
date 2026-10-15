'use client';

import LaskaLegacy from '@/components/LaskaLegacy';

export default function Post({ id }) {
  return <LaskaLegacy initialPage="blog-post" initialPostId={id} />;
}
