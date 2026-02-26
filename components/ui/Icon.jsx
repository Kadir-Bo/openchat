const SIZES = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export default function Icon({ name: IconComponent, size = "md", ...props }) {
  return <IconComponent size={SIZES[size]} {...props} />;
}
