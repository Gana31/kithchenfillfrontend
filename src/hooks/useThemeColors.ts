import { useAppSelector } from '../store/store';
import { selectIsDark } from '../store/themeSlice';
import { COLORS } from '../config/constants';

export function useThemeColors() {
  const isDark = useAppSelector(selectIsDark);
  const palette = isDark ? COLORS.dark : COLORS.light;

  return {
    primary: COLORS.primary,
    accent: COLORS.accent,
    danger: COLORS.danger,
    success: COLORS.success,
    background: palette.background,
    card: palette.card,
    text: palette.text,
    muted: palette.muted,
    border: palette.border,
    isDark,
  };
}
