// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Coq is ERC20, Ownable {
    constructor(address initialOwner)
        ERC20("Coq", "COQ")
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

contract CoqTip is ERC20, ERC20Permit, Ownable {
    constructor(address initialOwner)
        ERC20("CoqTip", "COQt")
        ERC20Permit("CoqTip")
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

contract TippingLottery {
    IERC20 private coqToken;
    CoqTip private coqTipToken;

    uint256 private minimumTip = 100;

    address[] public players;
    mapping(address => bool) isParticipating;
    uint256 private totalParticipatingCoqTip;
    address public winner;

    constructor(IERC20 _coqToken, CoqTip _coqTipToken) {
        coqToken = _coqToken;
        coqTipToken = _coqTipToken;
        totalParticipatingCoqTip = 0;
    }

    function tip(address recipient, uint256 amount) external {
        require(amount >= minimumTip, "Minimum tip is 100 COQ");
        require(coqToken.balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Calculate the lottery fraction
        uint256 forLottery = getLotteryFraction(amount);
        uint256 remaining = amount - forLottery;

        // Do tip transfer and mint CoqTip
        coqToken.transferFrom(msg.sender, address(this), forLottery); // Transfer the lottery fraction of the tip to the contract
        coqToken.transferFrom(msg.sender, recipient, remaining);      // Transfer the remaining tip to the recipient
        coqTipToken.mint(msg.sender, amount);                         // Mint CoqTip tokens for the tipper
        totalParticipatingCoqTip += amount;

        // Sign tipper up for lottery (if not already signed up)
        signUpForLottery(msg.sender);
    }

    function signUpForLottery(address tipper) private {
        for (uint256 i = 0; i < players.length; i++) {
            if (tipper == players[i]) {
                return;
            }
        }
        players.push(tipper);
    }

    function pickWinner() external {
        require(players.length > 0, "There must be at least one participant in the lottery");

        uint256 winningNumber = random() % totalParticipatingCoqTip;
        uint256 rollingSum = 0;
        uint256 i;
        for (i = 0; i < players.length; i++) {
            uint256 playerBalance = coqTipToken.balanceOf(players[i]);
            if (winningNumber >= rollingSum && winningNumber < rollingSum + playerBalance) {
                break;
            }
            rollingSum += playerBalance;
        }

        winner = players[i];
        coqToken.transfer(winner, coqToken.balanceOf(address(this)));

        players = new address[](0);
        totalParticipatingCoqTip = 0;
    }

    // Helper functions
    function getLotteryFraction(uint256 amount) public pure returns (uint256) {
        return amount / 10;
    }

    function random() private view returns (uint) {
        // TODO: We should probably use Chainlink VRF instead
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
    }
}