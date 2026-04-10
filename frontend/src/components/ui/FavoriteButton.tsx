"use client";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onClick: () => void;
  size?: number;
}

export default function FavoriteButton({
  isFavorite,
  onClick,
  size = 20,
}: FavoriteButtonProps) {
  return (
    <button
      onClick={onClick}
      className="group p-3 sm:p-2 -m-1 rounded-full hover:bg-highlight active:bg-highlight
                 transition-colors duration-200 cursor-pointer"
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isFavorite ? "#8B6914" : "none"}
        stroke="#8B6914"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
        style={{
          transform: isFavorite ? "scale(1.1)" : "scale(1)",
        }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
