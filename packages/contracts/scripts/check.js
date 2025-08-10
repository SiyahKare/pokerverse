const hre = require("hardhat");

async function main() {
  const usdc = await hre.ethers.getContractAt("MockUSDC", process.env.USDC_ADDRESS);
  const bet  = await hre.ethers.getContractAt("Bet", process.env.BET_ADDRESS);

  const gid = 0;
  const g = await bet.games(gid);
  console.log("state:", g.state, "pot:", g.pot.toString());

  const winner = process.env.WINNER;
  const vault  = process.env.VAULT_ADDRESS;

  const [wb, vb] = await Promise.all([
    usdc.balanceOf(winner),
    usdc.balanceOf(vault),
  ]);
  console.log("winner USDC:", wb.toString());
  console.log("vault  USDC:", vb.toString());
}
main().catch(e => (console.error(e), process.exit(1)));


