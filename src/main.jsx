import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import { WalletProvider } from "@mysten/dapp-kit";
import { SuiClientProvider, createNetworkConfig } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@mysten/dapp-kit/dist/index.css";
import "./styles.css";

// Configuração das redes disponíveis
const { networkConfig } = createNetworkConfig({
  devnet: { url: "https://fullnode.devnet.sui.io" },
  testnet: { url: "https://fullnode.testnet.sui.io" },
  mainnet: { url: "https://fullnode.mainnet.sui.io" },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* 👇 Define Mainnet como padrão */}
      <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
        <WalletProvider autoConnect>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
