'use client';

import { Children, cloneElement, isValidElement } from 'react';
import { motion } from 'framer-motion';

type MarqueeProps = {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  speed?: number;
};

export default function InfiniteMarquee({
  children,
  direction = 'left',
  speed = 30,
}: MarqueeProps) {
  const x = direction === 'left' ? [0, '-50%'] : ['-50%', 0];
  const items = Children.toArray(children);

  return (
    <div className="w-full overflow-hidden">
      <motion.div
        className="flex w-max gap-4"
        animate={{ x }}
        transition={{
          repeat: Infinity,
          repeatType: 'loop',
          duration: speed,
          ease: 'linear',
        }}
      >
        {items}
        {items.map((child, index) => {
          if (isValidElement(child)) {
            return cloneElement(child, { key: `clone-${index}` });
          }

          return <span key={`clone-${index}`}>{child}</span>;
        })}
      </motion.div>
    </div>
  );
}
