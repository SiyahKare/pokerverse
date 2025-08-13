// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";

import {TreasuryVault} from "../contracts/TreasuryVault.sol";
import {Bet} from "../contracts/Bet.sol";
import {ChipBank} from "../contracts/ChipBank.sol";

interface IERC20 { function transfer(address to, uint256 amount) external returns (bool); function approve(address spender, uint256 amount) external returns (bool); function balanceOf(address) external view returns (uint256); }

contract MockUSDC is Test {
    string public name = "MockUSDC";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    mapping(address=>uint256) public balanceOf;
    mapping(address=>mapping(address=>uint256)) public allowance;
    function transfer(address to, uint256 amt) external returns (bool){ balanceOf[msg.sender]-=amt; balanceOf[to]+=amt; return true; }
    function approve(address sp, uint256 amt) external returns (bool){ allowance[msg.sender][sp]=amt; return true; }
    function transferFrom(address f,address t,uint256 a) external returns (bool){ uint256 al=allowance[f][msg.sender]; require(al>=a); allowance[f][msg.sender]=al-a; balanceOf[f]-=a; balanceOf[t]+=a; return true; }
}

contract Invariants is Test {
    MockUSDC usdc;
    TreasuryVault vault;
    Bet bet;
    ChipBank chip;
    address owner = address(this);
    address dealer = address(0xD1);
    address pol = address(0xP0);
    address p1 = address(0xA1);
    address p2 = address(0xA2);

    function setUp() public {
        usdc = new MockUSDC();
        usdc.balanceOf(address(this)) = 1_000_000_000;
        vault = new TreasuryVault(IERC20(address(usdc)), owner);
        bet = new Bet(IERC20(address(usdc)), address(vault), owner, dealer, pol, 1000);
        chip = new ChipBank(address(usdc), address(vault), pol, 0, 1000, owner);
        // seed funds
        usdc.transfer(p1, 1_000_000);
        usdc.transfer(p2, 1_000_000);
    }

    function testSingleFinalizePerHand() public {
        vm.startPrank(owner);
        bet.createGame(2, 10, 100);
        vm.stopPrank();

        vm.prank(p1); usdc.approve(address(bet), type(uint256).max);
        vm.prank(p2); usdc.approve(address(bet), type(uint256).max);
        vm.prank(p1); bet.join(0);
        vm.prank(p2); bet.join(0);
        vm.prank(dealer); bet.proposeWinner(0, p1);
        vm.warp(block.timestamp + 16);
        vm.prank(dealer); bet.finalizeWinner(0);
        vm.expectRevert();
        vm.prank(dealer); bet.finalizeWinner(0);
    }

    function testSingleCashoutPerSession() public {
        vm.prank(p1); usdc.approve(address(chip), type(uint256).max);
        vm.prank(p1); chip.openSession(1, 100);
        vm.prank(p1); chip.cashOutFull(1, false, false);
        vm.expectRevert();
        vm.prank(p1); chip.cashOutFull(1, false, false);
    }
}


