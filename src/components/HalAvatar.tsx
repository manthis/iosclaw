import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { colors, shadows } from '../theme';

interface Props {
  size?: number;
  isActive?: boolean;
  isProcessing?: boolean;
}

export function HalAvatar({ size = 36, isActive = true, isProcessing = false }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isProcessing) {
      // Pulsing animation when processing
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.7,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(glowAnim, {
        toValue: isActive ? 0.4 : 0.1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isProcessing, isActive]);

  const eyeSize = size * 0.7;
  const innerEyeSize = size * 0.4;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: glowAnim,
          },
        ]}
      />
      
      {/* Main eye circle */}
      <View
        style={[
          styles.eye,
          {
            width: eyeSize,
            height: eyeSize,
            borderRadius: eyeSize / 2,
          },
        ]}
      >
        {/* Inner bright center */}
        <View
          style={[
            styles.innerEye,
            {
              width: innerEyeSize,
              height: innerEyeSize,
              borderRadius: innerEyeSize / 2,
              backgroundColor: isActive ? colors.hal.glow : colors.text.tertiary,
            },
          ]}
        />
        
        {/* Reflection */}
        <View
          style={[
            styles.reflection,
            {
              width: innerEyeSize * 0.3,
              height: innerEyeSize * 0.3,
              borderRadius: innerEyeSize * 0.15,
              top: eyeSize * 0.2,
              left: eyeSize * 0.35,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
    backgroundColor: colors.hal.primary,
    ...shadows.glow,
  },
  eye: {
    backgroundColor: colors.hal.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.hal.subtle,
  },
  innerEye: {
    ...shadows.glow,
  },
  reflection: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
