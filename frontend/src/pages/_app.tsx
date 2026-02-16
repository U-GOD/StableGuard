import "@/styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { AppProps } from "next/app";
import { Public_Sans, Merriweather } from "next/font/google";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { config } from "@/wagmi";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});
const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-merriweather",
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#d9af30", // Gold
            accentColorForeground: "#0F172A", // Dark
            borderRadius: "medium",
          })}
        >
          <main
            className={`${publicSans.variable} ${merriweather.variable} font-display bg-background-light dark:bg-background-dark min-h-screen text-slate-800 dark:text-slate-200`}
          >
            <Component {...pageProps} />
          </main>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
