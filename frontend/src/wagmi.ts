import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "StableGuard Dashboard",
  projectId: "b1f5c3d2e4a6f8b0c9d1e3f5a7b9c0d2", // WalletConnect fallback
  chains: [sepolia],
  ssr: true,
});
