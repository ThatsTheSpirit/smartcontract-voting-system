// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Voting.sol";

contract VotingEngine is Ownable {
    Voting[] public votings;
    mapping(address => Voting[]) public ownerToVotings;

    constructor() {}

    function createVoting(
        string memory _question,
        string[] memory _candidates,
        uint256 _duration,
        uint256 _quorum
    ) public {
        votings.push(new Voting(_question, _candidates, _duration, _quorum));
        ownerToVotings[msg.sender].push(votings[votings.length - 1]);
    }

    function getVoting(uint256 index) public view returns (Voting) {
        return votings[index];
    }
}
