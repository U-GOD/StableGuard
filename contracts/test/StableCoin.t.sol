// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {StableCoin} from "../src/StableCoin.sol";

contract StableCoinTest is Test {
    StableCoin public stableCoin;
    address public owner;
    address public user1;
    address public user2;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        stableCoin = new StableCoin(owner);
    }

    function test_InitialState() public {
        assertEq(stableCoin.name(), "StableGuard USD");
        assertEq(stableCoin.symbol(), "SGUSD");
        assertEq(stableCoin.owner(), owner);
    }

    function test_Mint() public {
        uint256 amount = 1000 * 10 ** 18;

        vm.expectEmit(true, false, false, true);
        emit Minted(user1, amount);

        stableCoin.mint(user1, amount);
        assertEq(stableCoin.balanceOf(user1), amount);
        assertEq(stableCoin.totalSupply(), amount);
    }

    function test_Mint_RevertIf_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        stableCoin.mint(user1, 100);
    }

    function test_Burn() public {
        uint256 amount = 1000 * 10 ** 18;
        stableCoin.mint(owner, amount);

        vm.expectEmit(true, false, false, true);
        emit Burned(owner, 500 * 10 ** 18);

        stableCoin.burn(500 * 10 ** 18);
        assertEq(stableCoin.balanceOf(owner), 500 * 10 ** 18);
        assertEq(stableCoin.totalSupply(), 500 * 10 ** 18);
    }

    function test_BurnFrom() public {
        uint256 amount = 1000 * 10 ** 18;
        stableCoin.mint(user1, amount);

        vm.prank(user1);
        stableCoin.approve(owner, 500 * 10 ** 18);

        vm.expectEmit(true, false, false, true);
        emit Burned(user1, 500 * 10 ** 18);

        stableCoin.burnFrom(user1, 500 * 10 ** 18);
        assertEq(stableCoin.balanceOf(user1), 500 * 10 ** 18);
    }

    function test_Pause_Unpause() public {
        stableCoin.pause();
        assertTrue(stableCoin.paused());

        stableCoin.unpause();
        assertFalse(stableCoin.paused());
    }

    function test_Pause_RevertIf_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        stableCoin.pause();
    }

    function test_Transfer_RevertIf_Paused() public {
        uint256 amount = 100 * 10 ** 18;
        stableCoin.mint(owner, amount);

        stableCoin.pause();

        vm.expectRevert(
            abi.encodeWithSelector(Pausable.EnforcedPause.selector)
        );
        bool success = stableCoin.transfer(user1, 10 * 10 ** 18);
        assertTrue(success, "Transfer should succeed");
    }

    function test_Mint_RevertIf_Paused() public {
        stableCoin.pause();

        vm.expectRevert(
            abi.encodeWithSelector(Pausable.EnforcedPause.selector)
        );
        stableCoin.mint(user1, 100);
    }
}
