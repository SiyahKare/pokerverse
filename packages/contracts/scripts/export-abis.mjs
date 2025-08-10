import { promises as fs } from "fs";
import path from "path";
// Monorepo root'u: script packages/contracts içinde koştuğu için ../../
const root = path.join(process.cwd(), "..", "..");
const artifacts = path.join(root, "packages/contracts/artifacts/contracts");
const outFrontend = path.join(root, "packages/frontend/abis");
const outBackend = path.join(root, "packages/backend/src/abis");
const outMiniapp = path.join(root, "pokerverse-miniapp/src/abis");

const pick = async (name) => {
  const p = path.join(artifacts, name, `${name.split("/").pop().replace(".sol","")}.json`);
  const raw = await fs.readFile(p, "utf8");
  const json = JSON.parse(raw);
  const abi = json.abi;
  return JSON.stringify(abi, null, 2);
};

const write = async (file, data) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
};

const run = async () => {
  const betAbi = await pick("Bet.sol");
  const vaultAbi = await pick("TreasuryVault.sol");
  let chipAbi = "[]";
  try { chipAbi = await pick("ChipBank.sol"); } catch {}
  await write(path.join(outFrontend, "Bet.json"), betAbi);
  await write(path.join(outBackend, "Bet.json"), betAbi);
  await write(path.join(outFrontend, "TreasuryVault.json"), vaultAbi);
  await write(path.join(outBackend, "TreasuryVault.json"), vaultAbi);
  if (chipAbi) {
    await write(path.join(outFrontend, "ChipBank.json"), chipAbi);
    await write(path.join(outBackend, "ChipBank.json"), chipAbi);
  }
  // Miniapp ABIs
  await write(path.join(outMiniapp, "Bet.json"), betAbi);
  await write(path.join(outMiniapp, "TreasuryVault.json"), vaultAbi);
  if (chipAbi) await write(path.join(outMiniapp, "ChipBank.json"), chipAbi);

  // Minimal ERC20 ABI for all targets (used by miniapp/web3)
  const erc20Abi = JSON.stringify([
    { "constant": true, "inputs": [{"name":"","type":"address"}], "name": "balanceOf", "outputs": [{"name":"","type":"uint256"}], "type": "function", "stateMutability": "view" },
    { "constant": false, "inputs": [{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}], "name": "approve", "outputs": [{"name":"","type":"bool"}], "type": "function", "stateMutability": "nonpayable" },
    { "constant": true, "inputs": [], "name": "decimals", "outputs": [{"name":"","type":"uint8"}], "type": "function", "stateMutability": "view" },
    { "constant": true, "inputs": [], "name": "symbol", "outputs": [{"name":"","type":"string"}], "type": "function", "stateMutability": "view" },
    { "constant": true, "inputs": [], "name": "name", "outputs": [{"name":"","type":"string"}], "type": "function", "stateMutability": "view" }
  ], null, 2);
  await write(path.join(outFrontend, "ERC20.json"), erc20Abi);
  await write(path.join(outBackend, "ERC20.json"), erc20Abi);
  await write(path.join(outMiniapp, "ERC20.json"), erc20Abi);

  // addresses.json
  const addrs = {
    31337: {
      USDC: process.env.LOCAL_USDC || "0x0000000000000000000000000000000000000000",
      CHIPBANK: process.env.LOCAL_CHIPBANK || "0x0000000000000000000000000000000000000000",
      BET: process.env.LOCAL_BET || "0x0000000000000000000000000000000000000000",
    },
    11155111: {
      USDC: process.env.SEPOLIA_USDC || "0x0000000000000000000000000000000000000000",
      CHIPBANK: process.env.SEPOLIA_CHIPBANK || "0x0000000000000000000000000000000000000000",
      BET: process.env.SEPOLIA_BET || "0x0000000000000000000000000000000000000000",
    },
    84532: {
      USDC: process.env.BASE_SEPOLIA_USDC || "0x0000000000000000000000000000000000000000",
      CHIPBANK: process.env.BASE_SEPOLIA_CHIPBANK || "0x0000000000000000000000000000000000000000",
      BET: process.env.BASE_SEPOLIA_BET || "0x0000000000000000000000000000000000000000",
    },
  };
  await write(path.join(root, "pokerverse-miniapp/src/addresses.json"), JSON.stringify(addrs, null, 2));

  console.log("ABIs exported to frontend & backend & miniapp.");
};

run().catch(e => { console.error(e); process.exit(1); });


