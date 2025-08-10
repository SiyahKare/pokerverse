require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PK = process.env.PRIVATE_KEY;

// sadece geçerli 64 haneli hex ise accounts'a ekle
const accounts = [];
if (PK && /^0x[0-9a-fA-F]{64}$/.test(PK)) accounts.push(PK);

module.exports = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true
    }
  },
  networks: {
    hardhat: {},
    localhost: { url: "http://127.0.0.1:8545" },
    sepolia: { url: RPC_URL, accounts }
  }
};


