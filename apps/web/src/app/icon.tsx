import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Simplified version of src/components/shared/logo.tsx's LogoMark — same
// three-petal lotus + profile silhouette, hair-strand highlights dropped
// since they're too thin to render reliably at favicon size. Satori/
// ImageResponse doesn't see the app's CSS custom properties, so colors are
// literal hex here rather than var(--brand-*).
export default function Icon() {
  return new ImageResponse(
    (
      <svg width={32} height={32} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M100 172C78 165 55 148 41 118C29 93 27 66 36 42C46 55 56 74 66 97C79 124 91 149 100 172Z"
          fill="#f0b0cb"
        />
        <path
          d="M100 172C122 165 145 148 159 118C171 93 173 66 164 42C154 55 144 74 134 97C121 124 109 149 100 172Z"
          fill="#c85f8f"
        />
        <path
          d="M100 172C130 150 138 100 118 50C112 32 105 18 100 8C95 18 88 32 82 50C62 100 70 150 100 172Z"
          fill="#872f58"
        />
        <path d="M150 46C159 36 172 33 179 40C172 48 159 51 150 46Z" fill="#c85f8f" />
        <path d="M155 57C165 51 178 53 184 60C176 65 163 65 155 57Z" fill="#f0b0cb" />
        <path
          d="M88 26C96 21 106 24 110 33C114 41 115 48 111 54C114 57 114 61 110 64C107 67 103 66 101 63C103 69 101 76 96 80C98 88 97 96 93 102L85 102L85 78C78 68 77 50 82 36C84 32 86 28 88 26Z"
          fill="#2a1420"
        />
      </svg>
    ),
    { ...size }
  );
}
