// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Voting.sol";

contract VotingEngine is Ownable {
    Voting[] public votings;
    mapping(address => Voting[]) public ownerToVotings;

    constructor() {}

    event VotingCreated(Voting voting);

    function createVoting(
        string memory _question,
        string[] memory _candidates,
        uint256 _timeEnd,
        uint256 _quorum,
        address[] memory _voters,
        address _owner
    ) public {
        votings.push(new Voting(_question, _candidates, _timeEnd, _quorum, _voters, _owner));
        ownerToVotings[msg.sender].push(votings[votings.length - 1]);
        emit VotingCreated(votings[votings.length - 1]);
    }

    function getVoting(uint256 index) public view returns (Voting) {
        //require(index >= 0 && index < votings.length - 1);
        return votings[index];
    }

    function getVotings() public view returns (Voting[] memory) {
        return votings;
    }

    function getVotingsCount() public view returns (uint256) {
        return votings.length;
    }

    function getVotingQuestion(uint256 index) public view returns (string memory) {
        return votings[index].getQuestion();
    }

    function getVotingsQuestions() public view returns (string[] memory) {
        string[] memory questions = new string[](votings.length);
        for (uint256 i = 0; i < votings.length; i++) {
            questions[i] = votings[i].getQuestion();
        }
        return questions;
    }
}
