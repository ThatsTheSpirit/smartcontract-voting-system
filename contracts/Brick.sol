// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Brick is Ownable {
    uint256 private start;
    uint256 private end;
    bool public opened;

    constructor(uint256 delay) {
        start = block.timestamp;
        end = start + delay;
        opened = true;
    }

    function check() public {
        opened = false;
    }

    function isClosed() public view returns (bool) {
        return !opened;
    }
}
