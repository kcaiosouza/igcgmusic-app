import { Stack } from 'expo-router';
import React from 'react';

export default function HomeStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="artist/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="album/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
