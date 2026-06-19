'use client';

import { useLayoutEffect, useRef, useState } from 'react';

// Renders children at a fixed design width and scales them down to fit the
// available container width. Used to show the full-width newsletter chrome
// inside the narrower admin dashboard. The outer box collapses to the scaled
// height so there's no empty gap below the transformed content.
export default function AutoScale({
  designWidth = 980,
  children,
}: {
  designWidth?: number;
  children: React.ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      // offsetHeight is the pre-transform layout height, unaffected by `scale`,
      // so reading it here can't feed back into its own value (no loop).
      setScale(Math.min(1, outer.clientWidth / designWidth));
      setInnerHeight(inner.offsetHeight);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer); // width changes
    ro.observe(inner); // content height changes as the admin types
    return () => ro.disconnect();
  }, [designWidth]);

  return (
    <div ref={outerRef} style={{ width: '100%', height: innerHeight != null ? innerHeight * scale : undefined, overflow: 'hidden' }}>
      <div ref={innerRef} style={{ width: designWidth, transformOrigin: 'top left', transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
