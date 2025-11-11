import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getWallets } from "@mysten/wallet-standard";

// ======== DOM ========
const $ = (s, r=document) => r.querySelector(s);
const walletBtn = $('#connectWallet');
const walletAddrEl = $('#walletAddress');
const sendBtn = $('#sendBatch');
const sendLog = $('#sendLog');

let rows = [];
let currentWallet = null;
let currentAccount = null;

// ======== WALLET CONNECT ========
async function connectWallet() {
  const { wallets } = getWallets().get();

  if (!wallets || wallets.length === 0) {
    alert("Nenhuma carteira encontrada. Abra a extensão e recarregue.");
    return;
  }

  const wallet = wallets.find(w =>
    /suiet|sui wallet|surf|ethos/i.test(w.name)
  ) || wallets[0];

  const connectFeature = wallet.features["standard:connect"];
  if (!connectFeature) return alert("A carteira não suporta conexão Wallet Standard.");

  const { accounts } = await connectFeature.connect();
  const account = accounts[0];

  currentWallet = wallet;
  currentAccount = account;

  walletAddrEl.textContent = account.address;
  walletBtn.textContent = `✅ ${wallet.name}`;
}

walletBtn.addEventListener("click", connectWallet);

// ======== SEND BATCH ========
async function sendBatch() {
  const valid = rows.filter(r => r.valid);

  if (!currentWallet || !currentAccount) return alert("Conecte a carteira primeiro.");
  if (!valid.length) return alert("Nenhuma linha válida encontrada.");

  const pkg = $('#packageId').value.trim();
  const network = $('#network').value;
  const gasBudget = Number($('#gasBudget').value || 0);

  const client = new SuiClient({ url: getFullnodeUrl(network) });

  const addresses = valid.map(r => r.address);
  const amounts = valid.map(r => BigInt(Math.floor(Number(r.value) * 1_000_000_000)));

  const tx = new TransactionBlock();
  tx.setSender(currentAccount.address);
  tx.moveCall({
    target: `${pkg}::batch_distribute::distribute`,
    arguments: [
      tx.pure(addresses),
      tx.pure(amounts)
    ],
  });

  if (gasBudget > 0) tx.setGasBudget(gasBudget);

  sendLog.textContent = "Assinando...";

  const exec = currentWallet.features["sui:signAndExecuteTransactionBlock"];
  if (!exec) return alert("A carteira não suporta signAndExecuteTransactionBlock.");

  try {
    const result = await exec.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: { showEffects: true, showEvents: true }
    });

    sendLog.textContent = "✅ Sucesso\n" + JSON.stringify(result, null, 2);
  } catch (err) {
    console.error(err);
    sendLog.textContent = "❌ Erro: " + (err.message || err);
  }
}

sendBtn.addEventListener("click", sendBatch);

// ======== CSV & UI — copie exatamente como estava ========
// Cole aqui **todo o código de CSV / tabela / edição / validação**
// (Ele permanece idêntico, não muda nada.)
