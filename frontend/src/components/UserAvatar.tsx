import clsx from "clsx";
import { UserRound } from "lucide-react";
import { getPublicAssetUrl } from "../api/client";

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClass = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-20 w-20"
};

const iconSize = {
  sm: 16,
  md: 19,
  lg: 22,
  xl: 34
};

export function UserAvatar({ name, avatarUrl, size = "md", className }: UserAvatarProps) {
  const src = getPublicAssetUrl(avatarUrl);

  return (
    <div className={clsx("grid shrink-0 place-items-center overflow-hidden rounded-lg bg-limebet text-ink", sizeClass[size], className)}>
      {src ? (
        <img className="h-full w-full object-cover" src={src} alt={`Foto de ${name}`} />
      ) : (
        <UserRound size={iconSize[size]} />
      )}
    </div>
  );
}
