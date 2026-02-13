// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {
    ERC20Burnable
} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {
    ERC20Pausable
} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StableGuard StableCoin (SGUSD)
 * @dev Mock Stablecoin for the Chainlink Convergence Hackathon.
 *      Includes Mint, Burn, and Pause functionality to simulate
 *      reserve-backed stablecoin operations and safeguards.
 */
contract StableCoin is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);

    constructor(
        address initialOwner
    ) ERC20("StableGuard USD", "SGUSD") Ownable(initialOwner) {}

    /**
     * @notice Mints new tokens. Only callable by owner.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        emit Minted(to, amount);
    }

    /**
     * @notice Burns tokens from caller.
     */
    function burn(uint256 value) public override {
        super.burn(value);
        emit Burned(_msgSender(), value);
    }

    /**
     * @notice Burns tokens from account (allowance).
     */
    function burnFrom(address account, uint256 value) public override {
        super.burnFrom(account, value);
        emit Burned(account, value);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}
