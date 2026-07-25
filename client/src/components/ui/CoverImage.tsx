import { coverUrl, coverUrlWebp } from "../../api";

interface CoverImageProps {
  isbn: string;
  alt: string;
  width: number;
  height: number;
  loading?: "lazy" | "eager";
  className?: string;
  style?: React.CSSProperties;
}

export function CoverImage({
  isbn,
  alt,
  width,
  height,
  loading = "lazy",
  className,
  style,
}: CoverImageProps) {
  return (
    <picture style={{ display: "block" }}>
      <source srcSet={coverUrlWebp(isbn)} type="image/webp" />
      <img
        className={className}
        src={coverUrl(isbn)}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        style={style}
      />
    </picture>
  );
}
