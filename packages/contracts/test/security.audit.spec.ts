import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Security/Audit Guards", () => {
  it("Bet: double finalize engellenir ve eventler yayınlanır", async () => {
    const [owner, dealer, p1, p2, polRecv] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await USDC.connect(owner).deploy();
    await usdc.waitForDeployment();

    const VaultF = await ethers.getContractFactory("TreasuryVault");
    const vault = await VaultF.connect(owner).deploy(await usdc.getAddress(), owner.address);
    await vault.waitForDeployment();

    const Bet = await ethers.getContractFactory("Bet");
    const bet = await Bet.connect(owner).deploy(
      await usdc.getAddress(),
      await vault.getAddress(),
      owner.address,
      dealer.address,
      polRecv.address,
      1000
    );
    await bet.waitForDeployment();

    const parse = (x: string) => ethers.parseUnits(x, 6);
    await usdc.connect(owner).transfer(p1.address, parse("100"));
    await usdc.connect(owner).transfer(p2.address, parse("100"));

    await (await bet.connect(owner).createGame(2, parse("10"), 100)).wait();
    await (await usdc.connect(p1).approve(await bet.getAddress(), parse("10"))).wait();
    await (await bet.connect(p1).join(0)).wait();
    await (await usdc.connect(p2).approve(await bet.getAddress(), parse("10"))).wait();
    await (await bet.connect(p2).join(0)).wait();

    await (await bet.connect(dealer).proposeWinner(0, p1.address)).wait();
    await time.increase(16);

    await expect(bet.connect(dealer).finalizeWinner(0))
      .to.emit(bet, "WinnerFinalized");

    await expect(bet.connect(dealer).finalizeWinner(0))
      .to.be.revertedWith("already finalized");
  });

  it("ChipBank: double cashout engellenir ve event yayınlanır", async () => {
    const [owner, dealer, p1, p2, polRecv] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await USDC.connect(owner).deploy();
    await usdc.waitForDeployment();

    const VaultF = await ethers.getContractFactory("TreasuryVault");
    const vault = await VaultF.connect(owner).deploy(await usdc.getAddress(), owner.address);
    await vault.waitForDeployment();

    const Chip = await ethers.getContractFactory("ChipBank");
    const chip = await Chip.connect(owner).deploy(
      await usdc.getAddress(),
      await vault.getAddress(),
      polRecv.address,
      0,
      1000,
      owner.address
    );
    await chip.waitForDeployment();

    const parse = (x: string) => ethers.parseUnits(x, 6);
    await usdc.connect(owner).transfer(p1.address, parse("100"));

    await (await usdc.connect(p1).approve(await chip.getAddress(), parse("10"))).wait();
    await (await chip.connect(p1).openSession(1, parse("10"))).wait();

    // tek oyuncu kendini çeksin
    await expect(chip.connect(p1).cashOutFull(1, false, false))
      .to.emit(chip, "CashOut");

    await expect(chip.connect(p1).cashOutFull(1, false, false))
      .to.be.revertedWith("already cashed out");
  });
});


