"use client";

import { useState } from "react";

export default function ProjectLogo({
  src,
  title,
  size = 44,
}: {
  src: string | null;
  title: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (title.trim()[0] ?? "?").toUpperCase();

  if (!src || failed) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-gradient-to-br from-violet-600/30 to-zinc-800 font-mono font-semibold text-violet-300"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 object-contain p-1"
      style={{ width: size, height: size }}
    />
  );
}
