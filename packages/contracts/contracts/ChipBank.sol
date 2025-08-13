// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVaultLike { function asset() external view returns (address); }

contract ChipBank is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;          // oyun varlığı
    address public immutable vault;        // TreasuryVault (fee için)
    address public polCollector;           // POL havuzu
    uint16  public polOnHandBps;           // el sonu LP kesintisi (örn 0 veya 1000)
    uint16  public polOnCashoutBps;        // cash-out LP kesintisi (örn 1000)
    uint16  public constant MAX_POL_BPS = 2000;

    // table => player => balances/deposits
    mapping(uint256 => mapping(address => uint256)) public balances;
    mapping(uint256 => mapping(address => uint256)) public deposits;
    mapping(uint256 => mapping(address => bool))    public active;
    mapping(uint256 => address) public sessionWinner; // opsiyonel "gerçek kazanan"
    // Idempotency guards
    mapping(uint256 => mapping(address => bool)) public cashedOut; // tid=>player
    mapping(uint256 => bool) public settledOnce; // tid bazında tek settlement (opsiyonel)

    event SessionOpened(uint256 indexed tid, address indexed player, uint256 buyIn);
    event Settled(uint256 indexed tid, address indexed winner, uint256 pot, uint256 fee, uint256 lpCutHand, uint256 netCredited);
    event CashOut(uint256 indexed tid, address indexed player, uint256 gross, uint256 lpCutCashout, uint256 netPaid);
    event SessionWinner(uint256 indexed tid, address indexed winner);
    event PolCollectorSet(address collector);
    event PolOnHandBpsSet(uint16 bps);
    event PolOnCashoutBpsSet(uint16 bps);

    modifier validBps(uint16 bps) { require(bps <= MAX_POL_BPS, "bps>max"); _; }

    constructor(
        address _usdc,
        address _vault,
        address _polCollector,
        uint16 _polOnHandBps,
        uint16 _polOnCashoutBps,
        address _owner
    ) Ownable(_owner) {
        usdc = IERC20(_usdc);
        vault = _vault;
        polCollector = _polCollector;
        polOnHandBps = _polOnHandBps;      // örn 0
        polOnCashoutBps = _polOnCashoutBps;// örn 1000 (%10)
    }

    function setPolCollector(address a) external onlyOwner nonReentrant { require(a!=address(0),"pol=0"); polCollector=a; emit PolCollectorSet(a); }
    function setPolOnHandBps(uint16 b) external onlyOwner validBps(b) nonReentrant { polOnHandBps=b; emit PolOnHandBpsSet(b); }
    function setPolOnCashoutBps(uint16 b) external onlyOwner validBps(b) nonReentrant { polOnCashoutBps=b; emit PolOnCashoutBpsSet(b); }

    // Join / top-up
    function openSession(uint256 tid, uint256 buyIn) external nonReentrant {
        require(buyIn > 0, "buyIn=0");
        usdc.safeTransferFrom(msg.sender, address(this), buyIn);
        balances[tid][msg.sender] += buyIn;
        deposits[tid][msg.sender] += buyIn;
        active[tid][msg.sender] = true;
        emit SessionOpened(tid, msg.sender, buyIn);
    }

    // Dealer çağırır: kaybedenler -> pot kesilir, fee & LP (ops.), net winner'a kredi
    // losers/amounts toplamı pot'a eşit olmalı
    function settle(
        uint256 tid,
        address[] calldata losers,
        uint256[] calldata amounts,
        address winner,
        uint16 rakeBps
    ) external onlyOwner nonReentrant {
        require(winner != address(0), "winner=0");
        require(losers.length == amounts.length, "len");
        uint256 pot = 0;
        for (uint i=0;i<losers.length;i++){
            address L = losers[i]; uint256 a = amounts[i];
            require(active[tid][L], "inactive loser");
            require(balances[tid][L] >= a, "insufficient loser bal");
            balances[tid][L] -= a; pot += a;
        }
        // fee -> vault
        uint256 fee = pot * rakeBps / 10_000;
        if (fee > 0) usdc.safeTransfer(vault, fee);
        uint256 gross = pot - fee;

        // per-hand LP cut (opsiyonel)
        uint256 lpHand = (gross * polOnHandBps) / 10_000;
        if (lpHand > 0) usdc.safeTransfer(polCollector, lpHand);

        uint256 net = gross - lpHand;
        balances[tid][winner] += net;
        emit Settled(tid, winner, pot, fee, lpHand, net);
    }

    // Masayı kapatırken "gerçek kazanan"ı işaretle (opsiyonel)
    function markSessionWinner(uint256 tid, address w) external onlyOwner nonReentrant {
        sessionWinner[tid] = w;
        emit SessionWinner(tid, w);
    }

    // Oyuncu tüm bakiyesini çeker; kurala göre LP kesintisi uygula
    function cashOutFull(uint256 tid, bool onlyWinnerMode, bool profitOnly) external nonReentrant {
        require(!cashedOut[tid][msg.sender], "already cashed out");
        uint256 bal = balances[tid][msg.sender];
        require(bal > 0, "no balance");
        if (onlyWinnerMode) {
            require(sessionWinner[tid] == msg.sender, "not session winner");
        }
        uint256 lp = 0;
        if (polOnCashoutBps > 0) {
            if (profitOnly) {
                uint256 paidIn = deposits[tid][msg.sender];
                uint256 profit = bal > paidIn ? (bal - paidIn) : 0;
                lp = profit * polOnCashoutBps / 10_000;
            } else {
                lp = bal * polOnCashoutBps / 10_000; // gross
            }
        }
        if (lp > 0) usdc.safeTransfer(polCollector, lp);
        uint256 net = bal - lp;
        balances[tid][msg.sender] = 0;
        active[tid][msg.sender] = false;
        cashedOut[tid][msg.sender] = true;
        usdc.safeTransfer(msg.sender, net);
        emit CashOut(tid, msg.sender, bal, lp, net);
    }

    // split-pot: birden çok kazanana tek settlement
    function settleSplit(
        uint256 tid,
        address[] calldata losers,
        uint256[] calldata amounts,
        address[] calldata winners,
        uint256[] calldata winnerCredits, // USDC (6d), toplam = (pot - fee - lpHand)
        uint16 rakeBps
    ) external onlyOwner nonReentrant {
        require(losers.length == amounts.length, "len L/A");
        require(winners.length == winnerCredits.length, "len W/C");

        uint256 pot = 0;
        for (uint i=0;i<losers.length;i++){
            address L = losers[i]; uint256 a = amounts[i];
            require(active[tid][L], "inactive loser");
            require(balances[tid][L] >= a, "insufficient bal");
            balances[tid][L] -= a; pot += a;
        }

        uint256 fee = pot * rakeBps / 10_000;
        if (fee > 0) usdc.safeTransfer(vault, fee);
        uint256 gross = pot - fee;

        uint256 lpHand = (gross * polOnHandBps) / 10_000;
        if (lpHand > 0) usdc.safeTransfer(polCollector, lpHand);
        uint256 net = gross - lpHand;

        uint256 sum = 0;
        for (uint j=0;j<winnerCredits.length;j++){ sum += winnerCredits[j]; }
        require(sum == net, "credits != net");

        for (uint j=0;j<winners.length;j++){
            balances[tid][winners[j]] += winnerCredits[j];
        }

        emit Settled(tid, address(0), pot, fee, lpHand, net);
    }
}


