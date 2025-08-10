require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY; // sadece varsa kullan

const networks = { hardhat: {} };
// Geçerli bir PRIVATE_KEY verilmişse sepolia ağı ekle
if (process.env.RPC_URL && PRIVATE_KEY && /^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
  networks.sepolia = { url: RPC_URL, accounts: [PRIVATE_KEY] };
}

module.exports = {
  solidity: "0.8.22",
  networks
};


