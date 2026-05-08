import React, { useRef, useCallback, useEffect } from 'react';
import { View, Animated as RNAnimated } from 'react-native';

const COLLECTION_TICKER_SPEED = 36; // px per second

function CollectionTicker({ text, accentColor }: { text: string; accentColor: string }) {
  const tickerX = useRef(new RNAnimated.Value(0)).current;
  const tickerW = useRef(0);
  const anim = useRef<RNAnimated.CompositeAnimation | null>(null);
  const startScroll = useCallback((width: number) => {
    if (width <= 0) return;
    tickerX.setValue(0);
    anim.current?.stop();
    const duration = (width / COLLECTION_TICKER_SPEED) * 1000;
    const loop = RNAnimated.loop(
      RNAnimated.timing(tickerX, {
        toValue: -width / 2,
        duration,
        easing: (t) => t,
        useNativeDriver: true,
      })
    );
    anim.current = loop;
    loop.start();
  }, []);
  useEffect(() => {
    return () => { anim.current?.stop(); };
  }, []);
  return (
    <View style={{ height: 20, overflow: 'hidden', justifyContent: 'center' }}>
      <RNAnimated.Text
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w !== tickerW.current) {
            tickerW.current = w;
            startScroll(w);
          }
        }}
        style={{
          transform: [{ translateX: tickerX }],
          fontSize: 10,
          fontWeight: '800',
          color: accentColor,
          letterSpacing: 1.0,
          whiteSpace: 'nowrap',
        } as any}
        numberOfLines={1}
      >
        {text}
      </RNAnimated.Text>
    </View>
  );
}

export default CollectionTicker;
