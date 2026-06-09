import type { TeamAsset } from "../utils/teamAssets";

export function TeamFlag({
  asset,
  label,
  size = "md"
}: {
  asset: TeamAsset;
  label: string;
  size?: "sm" | "md";
}) {
  const dimensions = size === "sm" ? "h-8 w-12" : "h-12 w-16";
  const emojiSize = size === "sm" ? "text-[1.8rem]" : "text-[2.4rem]";

  if (asset.flagSvg) {
    return (
      <img
        className={`${dimensions} shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.12)]`}
        src={asset.flagSvg}
        alt={`Bandeira de ${label}`}
      />
    );
  }

  return (
    <span className={`${dimensions} ${emojiSize} shrink-0 text-center leading-none`} aria-label={`Bandeira de ${label}`} role="img">
      {asset.flag}
    </span>
  );
}
