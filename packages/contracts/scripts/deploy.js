const hre = require("hardhat");

async function main() {
  const [deployer, dealer] = await hre.ethers.getSigners();

  const USDC = await (await hre.ethers.getContractFactory("MockUSDC")).connect(deployer).deploy();
  await USDC.deployed();

  const Vault = await (await hre.ethers.getContractFactory("TreasuryVault"))
    .connect(deployer).deploy(USDC.address, deployer.address);
  await Vault.deployed();

  const Bet = await (await hre.ethers.getContractFactory("Bet"))
    .connect(deployer).deploy(USDC.address, Vault.address, deployer.address, dealer.address);
  await Bet.deployed();

  console.log("USDC   :", USDC.address);
  console.log("Vault  :", Vault.address);
  console.log("Bet    :", Bet.address);
}

main().catch((e) => { console.error(e); process.exit(1); });


