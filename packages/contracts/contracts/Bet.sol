// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Game-bazlı pot + fee -> Vault (donation) akışı
contract Bet is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum GameState { Waiting, InProgress, UnderInvestigation, Ended }

    struct Game {
        GameState state;
        uint8 playerLimit;          // 2/4/6/9
        uint256 buyIn;              // USDC (6 decimals)
        uint16 feeBps;              // 0-200 bps
        address[] players;
        uint256 pot;
        address proposedWinner;
        uint64 investigationStart;
    }

    IERC20 public immutable asset;          // USDC
    address public immutable treasuryVault; // ERC4626 kasası (fee buraya)
    address public dealer;                  // yetkili

    // LP (POL) katkısı
    address public polCollector;            // LP için USDC toplayan adres/kontrat
    uint16  public polBps;                  // örn: 1000 = %10
    uint16  public constant MAX_POL_BPS = 2000; // güvenlik tavanı %20

    uint256 public nextGameId;
    uint16 public constant MAX_FEE_BPS = 200;           // %2
    uint256 public constant INVESTIGATION_PERIOD = 15; // dev: 15s (MVP smoke)
    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => bool)) public hasJoined;

    event GameCreated(uint256 gid, uint8 limit, uint256 buyIn, uint16 feeBps);
    event PlayerJoined(uint256 gid, address player);
    event GameStarted(uint256 gid);
    event WinnerProposed(uint256 gid, address winner);
    event WinnerFinalized(uint256 gid, address winner, uint256 pot, uint256 fee, uint256 payout);
    event LiquidityContribution(uint256 indexed gid, address indexed to, uint256 amount);

    constructor(
        IERC20 _asset,
        address _vault,
        address _initialOwner,
        address _dealer,
        address _polCollector,
        uint16 _polBps
    ) Ownable(_initialOwner) {
        require(_vault != address(0), "vault=0");
        require(_polCollector != address(0), "pol=0");
        require(_polBps <= MAX_POL_BPS, "pol>max");
        asset = _asset;
        treasuryVault = _vault;
        dealer = _dealer;
        polCollector = _polCollector;
        polBps = _polBps; // 1000 -> %10
    }
    modifier onlyDealer() {
        require(msg.sender == dealer || msg.sender == owner(), "not dealer");
        _;
    }
    function setDealer(address _dealer) external onlyOwner { require(_dealer!=address(0),"dealer=0"); dealer=_dealer; }
    function setPolCollector(address a) external onlyOwner { require(a!=address(0),"pol=0"); polCollector=a; }
    function setPolBps(uint16 b) external onlyOwner { require(b<=MAX_POL_BPS, "pol>max"); polBps=b; }

    function createGame(uint8 _limit, uint256 _buyIn, uint16 _feeBps) external onlyOwner returns (uint256 gid) {
        require(_limit==2||_limit==4||_limit==6||_limit==9,"limit");
        require(_feeBps<=MAX_FEE_BPS,"fee>max"); require(_buyIn>0,"buyIn=0");
        gid = nextGameId++;
        Game storage g = games[gid];
        g.state = GameState.Waiting; g.playerLimit=_limit; g.buyIn=_buyIn; g.feeBps=_feeBps;
        emit GameCreated(gid, _limit, _buyIn, _feeBps);
    }

    function join(uint256 gid) external nonReentrant {
        Game storage g = games[gid];
        require(g.state==GameState.Waiting,"state");
        require(!hasJoined[gid][msg.sender],"joined");
        require(g.players.length < g.playerLimit,"full");
        asset.safeTransferFrom(msg.sender, address(this), g.buyIn);
        g.players.push(msg.sender); hasJoined[gid][msg.sender]=true; g.pot+=g.buyIn;
        emit PlayerJoined(gid, msg.sender);
        if (g.players.length==g.playerLimit){ g.state=GameState.InProgress; emit GameStarted(gid); }
    }

    function proposeWinner(uint256 gid, address winner) external onlyDealer {
        Game storage g = games[gid]; require(g.state==GameState.InProgress || g.state==GameState.UnderInvestigation,"state");
        require(winner!=address(0),"winner=0");
        g.proposedWinner=winner;
        if (g.state==GameState.InProgress){ g.state=GameState.UnderInvestigation; g.investigationStart=uint64(block.timestamp); }
        emit WinnerProposed(gid, winner);
    }

    function finalizeWinner(uint256 gid) external onlyDealer nonReentrant {
        Game storage g = games[gid]; require(g.state==GameState.UnderInvestigation,"state");
        require(block.timestamp >= uint256(g.investigationStart)+INVESTIGATION_PERIOD,"period");
        require(g.proposedWinner!=address(0),"no winner");
        uint256 pot=g.pot; g.pot=0; g.state=GameState.Ended;
        // 1) Rake -> Vault
        uint256 fee = pot * g.feeBps / 10_000;
        uint256 gross = pot - fee;
        // 2) LP payı -> polCollector (örn. %10)
        uint256 lpCut = gross * polBps / 10_000;
        uint256 payout = gross - lpCut;
        // Transferler
        asset.safeTransfer(g.proposedWinner, payout);
        asset.safeTransfer(treasuryVault, fee);
        if (lpCut > 0) {
            asset.safeTransfer(polCollector, lpCut);
            emit LiquidityContribution(gid, polCollector, lpCut);
        }
        emit WinnerFinalized(gid, g.proposedWinner, pot, fee, payout);
    }
}


