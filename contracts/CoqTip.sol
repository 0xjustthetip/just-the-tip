// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; // REMOVE BEFORE DEPLOY
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

// !!!
// FOR TESTING PURPOSES ONLY
// !!!
contract Coq is ERC20, Ownable {
    constructor(address initialOwner)
        ERC20("Coq", "COQ")
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

contract CoqTip is Ownable, ReentrancyGuard {
  using Address for address payable;

  IERC20 private coqToken;

  uint public linkFee = 100000000000000000; // 0.1 * 10^18
  uint public tipFee = 10000000000000000;  // 0.01 * 10^18

  mapping(address => string) walletToHandle;
  mapping(address => bool) pendingLinks;

  // Mapping from handle to tip
  mapping(string => uint) tipsMap;

  // Event emitted when a tip is sent
  event TipSent(address indexed sender, string indexed recipient, uint amount);

  // Event emitted when a tip is claimed
  event TipsClaimed(address indexed recipient, uint amount);

  // Event emitted when a tip is revoked
  event TipsRevoked(address indexed sender, string indexed recipient);

  constructor(address initialOwner, IERC20 _coqToken)
        Ownable(initialOwner)
    {
      coqToken = _coqToken;
    }

  // Creating link between Twitter profile and wallet address
  // Only the contract owner is able to create the links, but first the user must create a pending link
  // This is needed to be able to get the AVAX fee for gas required for gas
  function createPendingLink() external payable nonReentrant {
    require(msg.value >= linkFee, "Insufficient link fee");
    require(isStringEmpty(walletToHandle[msg.sender]), "This wallet is already linked to a handle");
    payable(owner()).sendValue(msg.value);
    pendingLinks[msg.sender] = true;
  }


  function createLink(string memory handle, address wallet) external onlyOwner {
    require(isStringEmpty(walletToHandle[wallet]), "The handle is already linked to a wallet address");
    require(pendingLinks[wallet], "There is no pending link for the wallet.");
    walletToHandle[wallet] = handle;
    delete pendingLinks[wallet];
  }

  function unlinkHandle(address wallet) external onlyOwner {
    require(!isStringEmpty(walletToHandle[wallet]), "The wallet is not linked to a handle");
    delete walletToHandle[wallet];
  }

  // Function to send a tip
  function sendTip(string memory recipient, uint amount) external payable nonReentrant {
    require(amount > 0, "Tip amount must be greater than zero");
    require(msg.value >= tipFee, "Insufficient tip fee");
    require(coqToken.balanceOf(msg.sender) >= amount, "You don't have enough tokens for the tip");

    payable(owner()).sendValue(msg.value);
    coqToken.transferFrom(msg.sender, address(this), amount);
    tipsMap[recipient] += amount;
    emit TipSent(msg.sender, recipient, amount);
  }

   // Function for recipient to claim a tip
  function claimTips() external nonReentrant {
      string memory handle = walletToHandle[msg.sender];
      require(!isStringEmpty(handle), "The wallet is not linked to a handle");

      uint tips = tipsMap[handle];
      require(tips > 0, "No tips to claim");

      coqToken.transfer(msg.sender, tips);
      emit TipsClaimed(msg.sender, tips);

      tipsMap[handle] = 0;
  }

/*    // Function for sender to revoke all tips sent to handle
  function revokeTips() external nonReentrant {
      string memory handle = walletToHandle[msg.sender];
      require(!isStringEmpty(handle), "The wallet is not linked to a handle");

      Tip[] storage tips = tipsMap[handle];
      require(tips.length > 0, "No unclaimed tips sent to this handle");

      uint tipsToRevoke = 0;
      for (uint i = 0; i < tips.length; i++) {
        if (tips[i].sender == msg.sender) {
          tipsToRevoke += tips[i].amount;
          if (i != tips.length - 1) {
              // Move the last element into the place of the one being removed
              tips[i] = tips[tips.length - 1];
          }
          tips.pop(); // Remove the last element
          i--; // Adjust the index since the array length has changed
        }
      }
      require(tipsToRevoke > 0, "Found no tips to revoke");
      coqToken.transfer(msg.sender, tipsToRevoke);

      emit TipsRevoked(msg.sender, handle);
  } */

  // Views
  function hasPendingLink(address wallet) external view returns(bool) {
    return pendingLinks[wallet];
  }

  function getHandle(address wallet) external view returns(string memory) {
    return walletToHandle[wallet];
  }

  function unclaimedTips(address wallet) external view returns(uint) {
    string memory handle = walletToHandle[wallet];
    require(!isStringEmpty(handle), "No handle");
    return tipsMap[handle];
  }

  // Management helpers
  // Update fees
  function setFees(uint newLinkFee, uint newTipFee) external onlyOwner {
    linkFee = newLinkFee;
    tipFee = newTipFee;
  }

  // To retrieve any AVAX held by contract
  function transferAvax(address payable to) public onlyOwner nonReentrant {
    uint balance = address(this).balance;
    require(balance >= 0, "No AVAX in contract");
    to.sendValue(balance);
  }

  // To retrieve any COQ held by contract in case of having to migrate to new contract
  function transferCoq() public onlyOwner nonReentrant {
    uint balance = coqToken.balanceOf(address(this));
    require(balance >= 0, "No COQ in contract");
    coqToken.transfer(owner(), balance);
  }

  // Internal helpers
  // Check if string is empty
  function isStringEmpty(string memory a) private pure returns (bool) {
      return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(""));
  }
}
