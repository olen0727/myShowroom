'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body className="bg-neutral-950 text-white">
                <div className="flex flex-col items-center justify-center min-h-screen p-4">
                    <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
                    <p className="text-neutral-400 mb-6">Global Error: {error.message}</p>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
