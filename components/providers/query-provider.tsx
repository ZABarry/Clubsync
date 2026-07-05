"use client";

import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import { useState } from "react";

type QueryProviderProps = {
  children: React.ReactNode;
  config?: QueryClientConfig;
};

export function QueryProvider({ children, config }: QueryProviderProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
        ...config,
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <div className="flex h-full min-h-0 flex-col">{children}</div>
    </QueryClientProvider>
  );
}
