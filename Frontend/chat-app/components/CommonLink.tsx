"use client";

import React from "react";
import { useRouter } from "next/navigation";

type CommonLinkProps = {
  href: string;
  children: React.ReactNode;
  onSelect?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
  target?: "_self" | "_blank";
  rel?: string;
  style?: React.CSSProperties;
};

const CommonLink = ({
  href,
  children,
  onSelect,
  className = "",
  target = "_self",
  rel,
  style,
}: CommonLinkProps) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    
    // Let browser fully handle new-tab links
    if (target === "_blank") return;
    // allow browser new-tab behavior
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;

    e.preventDefault();
    onSelect?.(e); // optional side effect
    router.push(href);
  };

  return (
    <a href={href} className={className} onClick={handleClick} style={style} target={target}
      rel={
        target === "_blank"
          ? `${rel ?? ""} noopener noreferrer`.trim()
          : rel
      }>
      {children}
    </a>
  );
};

export default CommonLink;
