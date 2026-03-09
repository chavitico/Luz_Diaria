/**
 * CardThumb
 *
 * Lightweight card thumbnail for trade UI.
 * Resolves image from local disk cache (fast) or remote URL (fallback).
 * Shows a gradient placeholder while loading.
 *
 * Height: ~140px. Width auto-sizes to card aspect ratio (≈2:3).
 */

import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BIBLICAL_CARDS } from '@/lib/biblical-cards';
import { resolveCardImageUri, resolveCardImageUriSync } from '@/lib/card-image-cache';

const THUMB_H = 140;
const THUMB_W = Math.round(THUMB_H * (2 / 3)); // ~93px

interface CardThumbProps {
  cardId: string;
  /** Override height (width scales proportionally). Default: 140 */
  height?: number;
}

export function CardThumb({ cardId, height = THUMB_H }: CardThumbProps) {
  const card = BIBLICAL_CARDS[cardId];
  const w = Math.round(height * (2 / 3));

  // Seed with sync value (instant if already in memory cache)
  const [uri, setUri] = useState<string | null>(() =>
    card ? resolveCardImageUriSync(card) : null
  );

  useEffect(() => {
    if (!card?.imageUrl) return;
    // Already resolved synchronously
    if (uri) return;
    let cancelled = false;
    resolveCardImageUri(card).then((resolved) => {
      if (!cancelled && resolved) setUri(resolved);
    });
    return () => { cancelled = true; };
  }, [card, uri]);

  const gradient = card?.gradientColors ?? ['#1E293B', '#0F172A', '#1E293B'];

  return (
    <View style={[styles.root, { width: w, height }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={gradient as [string, string, string]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
});
