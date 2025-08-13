// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TreasuryVault is ERC20, ERC4626, Ownable {
    using SafeERC20 for IERC20;
    constructor(IERC20 asset_, address initialOwner)
        ERC20("PokerVault Share", "sPOKER")
        ERC4626(asset_)
        Ownable(initialOwner)
    {}

    // İsteyen bağışlayabilir (pay basmadan NAV artar)
    function donate(uint256 amount) external {
        // ERC-4626 asset decimals ile uyumlu; USDC 6d varsayımı uyumludur
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), amount);
    }

    // OZ v5: ERC20 ve ERC4626 her ikisi de decimals tanımlar → override şart.
    function decimals() public view override(ERC20, ERC4626) returns (uint8) {
        return super.decimals();
    }
}


