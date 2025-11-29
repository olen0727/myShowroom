'use client';

import { NextUIProvider } from '@nextui-org/react';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextUIProvider>
            {children}
            <Toaster position="bottom-right" richColors theme="dark" />
        </NextUIProvider>
    );
}
