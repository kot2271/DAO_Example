// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {

  constructor(string memory name, string memory symbol) ERC20(name, symbol) {
    _mint(msg.sender, 1000000 * (10 ** decimals()));
  }

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }

  function burn(address from, uint256 amount) public onlyOwner {
    _burn(from, amount);
  }
  
  function burnFrom(address from, uint256 amount) public onlyOwner {
    uint256 currentAllowance = allowance(from, _msgSender());
    require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
    unchecked {
      _approve(from, _msgSender(), currentAllowance - amount);
    }
    _burn(from, amount);
  }

  event TokensMinted(address indexed to, uint256 amount);
  event TokensBurned(address indexed from, uint256 amount);

  function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
    super._beforeTokenTransfer(from, to, amount);
    
    if (from == address(0)) {
      emit TokensMinted(to, amount);
    }
    
    if (to == address(0)) {
      emit TokensBurned(from, amount);
    }
  }

}