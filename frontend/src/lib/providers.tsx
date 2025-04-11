'use client';

import { PropsWithChildren } from 'react';

export function Providers({ children }: PropsWithChildren) {
  return (
    <>
      {/* Any global providers would go here */}
      {children}
    </>
  );
}

export default Providers;
