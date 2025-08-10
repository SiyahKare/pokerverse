const hre = require("hardhat");

async function main() {
  const [deployer, p1, p2] = await hre.ethers.getSigners();

  const usdcAddr = process.env.USDC_ADDRESS;
  const betAddr = process.env.BET_ADDRESS;
  if (!usdcAddr || !betAddr) throw new Error("Set USDC_ADDRESS & BET_ADDRESS env");

  const usdc = await hre.ethers.getContractAt("MockUSDC", usdcAddr, deployer);
  const bet = await hre.ethers.getContractAt("Bet", betAddr, deployer);

  // oyunculara 1,000 USDC
  const amount = hre.ethers.parseUnits("1000", 6);
  await (await usdc.transfer(p1.address, amount)).wait();
  await (await usdc.transfer(p2.address, amount)).wait();

  // masa oluştur: 2 oyuncu, buy-in 10 USDC, %1 rake
  const buyIn = hre.ethers.parseUnits("10", 6);
  await (await bet.createGame(2, buyIn, 100)).wait();

  console.log("Seed ok. Players funded and game#0 created.");
}

main().catch(e => { console.error(e); process.exit(1); });


