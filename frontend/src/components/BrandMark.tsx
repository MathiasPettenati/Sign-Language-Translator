import type { ImgHTMLAttributes } from "react";

type BrandMarkProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  title?: string;
};

export function BrandMark({ className = "", title, ...props }: BrandMarkProps) {
  return (
    <img
      src="/brand-mark.svg"
      className={`brand-mark ${className}`}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      {...props}
    />
  );
}
