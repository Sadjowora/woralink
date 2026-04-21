type SkeletonProps = {
  className?: string;
  rounded?: "md" | "lg";
  shimmer?: boolean;
};

export default function Skeleton({
  className = "",
  rounded = "md",
  shimmer = true,
}: SkeletonProps) {
  const radiusClass = rounded === "lg" ? "rounded-lg" : "rounded-md";

  return (
    <div
      aria-hidden="true"
      className={[
        "border border-gray-100 bg-accents-2",
        radiusClass,
        shimmer
          ? "animate-shimmer bg-[linear-gradient(110deg,var(--color-accents-2),var(--color-accents-1),var(--color-accents-2))] bg-size-[200%_100%]"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
