import Image from "next/image";

const SIZE_MAP = {
  xs: { wrapper: "w-6 h-6", text: "text-[10px]", ring: "ring-1" },
  sm: { wrapper: "w-8 h-8", text: "text-xs", ring: "ring-1" },
  md: { wrapper: "w-11 h-11", text: "text-sm", ring: "ring-1" },
  lg: { wrapper: "w-16 h-16", text: "text-lg", ring: "ring-2" },
  xl: { wrapper: "w-20 h-20", text: "text-xl", ring: "ring-2" },
};

export default function UserProfileImage({
  image,
  username,
  size = "sm",
  className = "",
}) {
  const { wrapper, text, ring } = SIZE_MAP[size] ?? SIZE_MAP.sm;
  const letter = username?.trim().slice(0, 1).toUpperCase() || "?";
  const colorClass = "from-sky-500/60 to-blue-500/30 text-white";

  return (
    <div
      className={`
        relative ${wrapper} rounded-full shrink-0 overflow-hidden
        ${ring} ring-white/10
        shadow-sm
        ${className}
      `}
    >
      {image ? (
        <Image
          src={image}
          alt={username || "Profile"}
          fill
          sizes="80px"
          className="object-cover"
        />
      ) : (
        <div
          className={`
            w-full h-full
            bg-linear-to-br ${colorClass}
            flex items-center justify-center
            select-none font-medium tracking-wide ${text}
          `}
        >
          {letter}
        </div>
      )}
    </div>
  );
}
