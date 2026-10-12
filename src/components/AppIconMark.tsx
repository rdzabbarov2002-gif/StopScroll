import Ionicons from "@expo/vector-icons/Ionicons";
import { useId } from "react";
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

/** The app's mark: white pause bars on a blue gradient tile (the SOS button, as an icon). */
export function AppIconMark({ size = 52 }: { size?: number }) {
  const radius = size * 0.27;
  // Unique per instance: a gradient referenced from a hidden screen would not paint on web.
  const gradientId = `appMark${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#3D9BFF" />
            <Stop offset="1" stopColor="#0062E6" />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={size} rx={radius} fill={`url(#${gradientId})`} />
      </Svg>
      <Ionicons name="pause" size={size * 0.48} color="#FFFFFF" />
    </View>
  );
}
