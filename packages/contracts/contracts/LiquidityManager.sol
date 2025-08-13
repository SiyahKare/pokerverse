// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IUniswapV2Router02 {
    function addLiquidity(
        address tokenA, address tokenB, uint amountADesired, uint amountBDesired,
        uint amountAMin, uint amountBMin, address to, uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
}

contract LiquidityManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IERC20 public immutable poker; // POKER token adresi (governance)
    IUniswapV2Router02 public router;
    address public lpRecipient;    // LP tokenlarının gideceği kasa/multisig

    event Deposited(address indexed from, uint256 amount);
    event LiquidityAdded(uint256 usdcUsed, uint256 pokerUsed, uint256 liquidity);

    constructor(address _usdc, address _poker, address _router, address _lpRecipient, address _owner) Ownable(_owner) {
        usdc = IERC20(_usdc);
        poker = IERC20(_poker);
        router = IUniswapV2Router02(_router);
        lpRecipient = _lpRecipient;
    }

    // Bet.sol buraya USDC gönderiyor; ayrıca isteyen donate edebilir
    function depositUSDC(uint256 amount) external nonReentrant {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    function addLiquidity(uint256 usdcAmt, uint256 pokerAmt, uint256 minUsdc, uint256 minPoker) external onlyOwner nonReentrant {
        // CEI: önce internal state değişimleri yok; allowance reset + approve sonra etkileşim
        IERC20(usdc).approve(address(router), 0);
        IERC20(usdc).approve(address(router), usdcAmt);
        IERC20(poker).approve(address(router), 0);
        IERC20(poker).approve(address(router), pokerAmt);
        (, , uint liq) = router.addLiquidity(
            address(poker), address(usdc),
            pokerAmt, usdcAmt,
            minPoker, minUsdc,
            lpRecipient,
            block.timestamp + 120
        );
        emit LiquidityAdded(usdcAmt, pokerAmt, liq);
    }
}


