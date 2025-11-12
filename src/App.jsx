import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransactionBlock,
} from "@mysten/dapp-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import Papa from "papaparse";
import { useState } from "react";
import "./App.css";

export default function App() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [log, setLog] = useState("Waiting...");
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransactionBlock } =
    useSignAndExecuteTransactionBlock();

  const PACKAGE_ID = "0xf261ea0440bf70d2acb6badeb21b76133c7543fa555e3783a6fe646cde2251b8";

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed = res.data.map((r) => ({
          address: r.address?.trim(),
          value: parseFloat(r.value || 0),
        }));
        setRows(parsed);
        const sum = parsed.reduce(
          (acc, row) => acc + (isNaN(row.value) ? 0 : row.value),
          0
        );
        setTotal(sum);
      },
    });
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "address,value\n0x0000000000000000000000000000000000000001,1\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suiflow_template.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleSendBatch = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }

    const validRows = rows.filter((r) => r.address && r.value > 0);
    if (!validRows.length) {
      alert("No valid rows to send.");
      return;
    }

    setLog("🚀 Preparing transaction...");

    const addresses = validRows.map((r) => r.address);
    const amounts = validRows.map((r) =>
      Math.floor(Number(r.value) * 1_000_000_000)
    );
    const totalAmount = amounts.reduce((a, b) => a + b, 0);

    try {
      const tx = new TransactionBlock();
      const coin = tx.splitCoins(tx.gas, [tx.pure(totalAmount)]);

      tx.moveCall({
        target: `${PACKAGE_ID}::batch_distribute::distribute`,
        arguments: [
          coin,
          tx.pure(addresses, "vector<address>"),
          tx.pure(amounts, "vector<u64>"),
        ],
      });

      setLog("⏳ Awaiting wallet signature...");

      await signAndExecuteTransactionBlock(
        {
          transactionBlock: tx,
          chain: "sui:mainnet",
          options: { showEffects: true, showEvents: true },
        },
        {
          onSuccess: (res) => {
            setLog(`✅ Success!\nDigest: ${res.digest}`);
          },
          onError: (err) => {
            setLog(`❌ Error: ${err.message}`);
          },
        }
      );
    } catch (err) {
      setLog("❌ Failed: " + err.message);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">SuiFlow</h1>
        <p className="subtitle">
          Batch Transfer via CSV <span className="mono">(address, value)</span>
        </p>
        <div className="actions">
          <ConnectButton />
          <button className="button ghost" onClick={handleDownloadTemplate}>
            📄 Download CSV Template
          </button>
        </div>
      </header>

      <main className="content">
        <section className="card">
          <h2>📂 Load CSV</h2>
          <input type="file" accept=".csv" onChange={handleFile} />
          <p className="muted">Expected columns: address, value</p>
        </section>

        <section className="card">
          <h2>📊 Summary</h2>
          <div className="stats">
            <div className="stat">
              <strong>{rows.length}</strong>
              <span>Rows</span>
            </div>
            <div className="stat">
              <strong>{rows.filter((r) => r.address && r.value > 0).length}</strong>
              <span>Valid</span>
            </div>
            <div className="stat">
              <strong>{total}</strong>
              <span>Total (SUI)</span>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>👁 Preview</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Address</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="mono">{r.address}</td>
                    <td>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h2>🚀 Send</h2>
          <div className="send-section">
            <p>
              <span className="muted">Wallet:</span>{" "}
              <span className="mono">
                {account?.address || "(disconnected)"}
              </span>
            </p>
            <button className="button primary" onClick={handleSendBatch}>
              Send Batch
            </button>
            <pre className="log">{log}</pre>
          </div>
        </section>
      </main>
    </div>
  );
}
