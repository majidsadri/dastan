interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "gold";
}

export default function Badge({ children, variant = "default" }: BadgeProps) {
  const styles =
    variant === "gold"
      ? "bg-gold/10 text-gold border-gold/20"
      : "bg-linen text-sepia-light border-warm-border";

  return (
    <span
      className={`inline-block px-3 py-1 text-xs tracking-wide rounded-full border ${styles}`}
      style={{ fontFamily: "var(--font-ui)" }}
    >
      {children}
    </span>
  );
}
