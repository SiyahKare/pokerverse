const hre = require("hardhat");

function u(x) { return hre.ethers.formatUnits(x, 6); }
function p(x) { return hre.ethers.parseUnits(x, 6); }

async function main() {
  const { USDC_ADDRESS, BET_ADDRESS, VAULT_ADDRESS, POL_ADDRESS, WINNER } = process.env;
  if (!USDC_ADDRESS || !BET_ADDRESS || !VAULT_ADDRESS || !POL_ADDRESS || !WINNER) {
    throw new Error("Set USDC_ADDRESS, BET_ADDRESS, VAULT_ADDRESS, POL_ADDRESS, WINNER");
  }

  const usdc = await hre.ethers.getContractAt("MockUSDC", USDC_ADDRESS);
  const bet  = await hre.ethers.getContractAt("Bet", BET_ADDRESS);

  const gid = 0;
  const g = await bet.games(gid);

  const [balWinner, balVault, balPol, balBet] = await Promise.all([
    usdc.balanceOf(WINNER),
    usdc.balanceOf(VAULT_ADDRESS),
    usdc.balanceOf(POL_ADDRESS),
    usdc.balanceOf(BET_ADDRESS),
  ]);

  const fee = p("0.20");
  const lp  = p("1.98");
  const payout = p("17.82");

  console.log("Game state :", g.state);
  console.log("Balances   :");
  console.log("- Winner   :", u(balWinner), "(expected +", u(payout), ")");
  console.log("- Vault    :", u(balVault), "(expected ", u(fee)+")");
  console.log("- POL      :", u(balPol),   "(expected ", u(lp)+")");
  console.log("- Bet      :", u(balBet),   "(should be 0.000000)");

  const okVault = balVault === fee;
  const okPOL   = balPol === lp;
  const okBet   = balBet === 0n;

  console.log("\nChecks:", {
    vaultOK: okVault, polOK: okPOL, betEmpty: okBet
  });
}

main().catch((e) => (console.error(e), process.exit(1)));


