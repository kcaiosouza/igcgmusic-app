import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function AlbumFallbackRoute() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();

  return (
    <Redirect
      href={{
        pathname: '/(tabs)/home/album/[id]' as any,
        params: { id: id || '', title: title || '' },
      }}
    />
  );
}
