const SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  "2xl": 32,
  "3xl": 48,
};

export default function Icon({ name: IconComponent, size = "md", ...props }) {
  return <IconComponent size={SIZES[size]} {...props} />;
}
