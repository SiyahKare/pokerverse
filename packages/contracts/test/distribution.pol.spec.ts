import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Bet + Vault + POL distribution", () => {
  it("fee -> Vault, lpCut -> polCollector, net -> winner", async () => {
    const [owner, dealer, p1, p2, polRecv] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await USDC.connect(owner).deploy();
    await usdc.waitForDeployment();

    const VaultF = await ethers.getContractFactory("TreasuryVault");
    const vault = await VaultF.connect(owner).deploy(await usdc.getAddress(), owner.address);
    await vault.waitForDeployment();

    const polCollector = polRecv.address;
    const polBps = 1000; // %10
    const feeBps = 100;  // %1

    const Bet = await ethers.getContractFactory("Bet");
    const bet = await Bet.connect(owner).deploy(
      await usdc.getAddress(),
      await vault.getAddress(),
      owner.address,
      dealer.address,
      polCollector,
      polBps
    );
    await bet.waitForDeployment();

    const parse = (x: string) => ethers.parseUnits(x, 6);
    await usdc.connect(owner).transfer(p1.address, parse("1000"));
    await usdc.connect(owner).transfer(p2.address, parse("1000"));

    await (await bet.connect(owner).createGame(2, parse("10"), feeBps)).wait();

    await (await usdc.connect(p1).approve(await bet.getAddress(), parse("10"))).wait();
    await (await bet.connect(p1).join(0)).wait();

    await (await usdc.connect(p2).approve(await bet.getAddress(), parse("10"))).wait();
    await (await bet.connect(p2).join(0)).wait();

    await (await bet.connect(dealer).proposeWinner(0, p1.address)).wait();
    await time.increase(16);
    await (await bet.connect(dealer).finalizeWinner(0)).wait();

    const fee = parse("0.20");
    const lp = parse("1.98");
    const payout = parse("17.82");

    const balVault = await usdc.balanceOf(await vault.getAddress());
    const balPol   = await usdc.balanceOf(polCollector);
    const balP1    = await usdc.balanceOf(p1.address);
    const balP2    = await usdc.balanceOf(p2.address);

    expect(balP1).to.equal(parse("1007.82"));
    expect(balP2).to.equal(parse("990"));
    expect(balVault).to.equal(fee);
    expect(balPol).to.equal(lp);
    expect(await usdc.balanceOf(await bet.getAddress())).to.equal(0n);
  });
});


