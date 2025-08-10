const hre = require("hardhat");

async function main() {
  const [deployer, dealer] = await hre.ethers.getSigners();

  const usdc = await (await hre.ethers.getContractFactory("MockUSDC")).connect(deployer).deploy();
  await usdc.waitForDeployment();

  const vault = await (await hre.ethers.getContractFactory("TreasuryVault"))
    .connect(deployer).deploy(await usdc.getAddress(), deployer.address);
  await vault.waitForDeployment();

  // POL collector: lokal için deployer; prod: LiquidityManager.address
  const polCollector = deployer.address;

  // ChipBank v2: per-hand LP=0, cash-out LP=%10
  const chipBank = await (await hre.ethers.getContractFactory("ChipBank"))
    .connect(deployer).deploy(await usdc.getAddress(), await vault.getAddress(), polCollector, 0, 1000, deployer.address);
  await chipBank.waitForDeployment();

  // Bet (opsiyonel, V1 uyumluluk): LP %10 paramıyla
  const bet = await (await hre.ethers.getContractFactory("Bet"))
    .connect(deployer).deploy(
      await usdc.getAddress(),
      await vault.getAddress(),
      deployer.address,
      dealer.address,
      polCollector,
      1000
    );
  await bet.waitForDeployment();

  console.log("USDC       :", await usdc.getAddress());
  console.log("Vault      :", await vault.getAddress());
  console.log("ChipBank   :", await chipBank.getAddress());
  console.log("Bet        :", await bet.getAddress());
}

main().catch((e) => { console.error(e); process.exit(1); });


