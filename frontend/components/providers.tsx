"use client";
import { NhostClient, NhostProvider } from "@nhost/nextjs";
import { NhostApolloProvider } from "@nhost/react-apollo";
import { PropsWithChildren } from "react";

const nhost = new NhostClient({
  subdomain: "local",
});

export function Providers({ children }: PropsWithChildren) {
  return (
    <NhostProvider nhost={nhost}>
      <NhostApolloProvider nhost={nhost}>
        {children}
      </NhostApolloProvider>
    </NhostProvider>
  );
}
