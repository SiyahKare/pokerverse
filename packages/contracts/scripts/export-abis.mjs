import { promises as fs } from "fs";
import path from "path";
// Monorepo root'u: script packages/contracts içinde koştuğu için ../../
const root = path.join(process.cwd(), "..", "..");
const artifacts = path.join(root, "packages/contracts/artifacts/contracts");
const outFrontend = path.join(root, "packages/frontend/abis");
const outBackend = path.join(root, "packages/backend/src/abis");

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
  console.log("ABIs exported to frontend & backend.");
};

run().catch(e => { console.error(e); process.exit(1); });


