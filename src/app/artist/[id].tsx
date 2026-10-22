import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function ArtistFallbackRoute() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();

  return (
    <Redirect
      href={{
        pathname: '/(tabs)/home/artist/[id]' as any,
        params: { id: id || '', name: name || '' },
      }}
    />
  );
}
