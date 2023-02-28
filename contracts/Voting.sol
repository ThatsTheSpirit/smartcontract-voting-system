// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

error Voting__AlreadyRegistered();
error Voting__AlreadyVoted();
error Voting__WrongState();
error Voting__NotRegistered();
error Voting__CandidateNotFound();
error Voting__TimeExpired();

contract Voting is Ownable {
    struct Voter {
        bool registered;
        bool voted;
    }

    enum State {
        STARTED,
        VOTING,
        CALCULATING,
        ENDED
    }

    enum ResultState {
        QUORUM_NO,
        QUORUM_YES
    }

    uint256 private immutable i_startTime;
    uint256 private immutable i_endTime;
    //uint256 private lastTimeStamp;
    uint256 public immutable i_quorum; //percent of voted
    uint256 private votedCount; //count of already voted
    State private state;
    ResultState public resultState;
    string private question;
    string[] private candidates;
    address[] private registeredVoters;
    mapping(string => uint256) public candidatesVotes;
    mapping(address => Voter) public voters;

    event VoterRegistered(address indexed voter);
    event VoterVoted(address indexed voter, string candidate);

    constructor(
        /* uint _startTime,*/
        /*uint _endTime,*/
        string memory _question,
        string[] memory _candidates,
        uint256 _duration,
        uint256 _quorum
    ) {
        i_startTime = block.timestamp;
        i_endTime = block.timestamp + _duration;
        i_quorum = _quorum;
        question = _question;
        candidates = _candidates;
        state = State.STARTED;
        //lastTimeStamp = block.timestamp;
    }

    modifier onlyRegistered() {
        if (!voters[msg.sender].registered) {
            revert Voting__NotRegistered();
        }
        _;
    }

    function registerVoter(address _voter) public onlyOwner {
        if (voters[_voter].registered) revert Voting__AlreadyRegistered();
        if (timeExpired()) {
            revert Voting__TimeExpired();
        }
        if (state != State.STARTED) {
            revert Voting__WrongState();
        }
        voters[_voter].registered = true;
        registeredVoters.push(_voter);
        emit VoterRegistered(_voter);
    }

    function registerVoters(address[] memory _voters) public onlyOwner {
        for (uint256 i = 0; i < _voters.length; i++) {
            registerVoter(_voters[i]);
        }
        state = State.VOTING;
    }

    function voteFor(string memory _candidate) public onlyRegistered {
        if (voters[msg.sender].voted) {
            revert Voting__AlreadyVoted();
        }
        if (state != State.VOTING) {
            revert Voting__WrongState();
        }

        if (!candidateExists(_candidate)) {
            revert Voting__CandidateNotFound();
        }

        if (timeExpired()) {
            state = State.CALCULATING;
            revert Voting__TimeExpired();
        }
        ++candidatesVotes[_candidate];
        voters[msg.sender].voted = true;
        emit VoterVoted(msg.sender, _candidate);
    }

    function getQuorumPercent() private view returns (uint256) {
        uint256 voted = 0; //registered * 100 / voted
        for (uint256 i = 0; i < registeredVoters.length; i++) {
            if (voters[registeredVoters[i]].voted) {
                voted++;
            }
        }
        return (registeredVoters.length * 100) / voted;
    }

    function quorumArchieved() private view returns (bool) {
        return getQuorumPercent() >= i_quorum;
    }

    function getWinner() public returns (ResultState, string memory) {
        if (state != State.CALCULATING) {
            revert Voting__WrongState();
        }
        if (!quorumArchieved()) {
            resultState = ResultState.QUORUM_NO;
            return (resultState, "");
        }

        resultState = ResultState.QUORUM_YES;

        uint256 maxVotes = 0;
        uint256 indexWinner = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidatesVotes[candidates[i]] > maxVotes) {
                maxVotes = candidatesVotes[candidates[i]];
                indexWinner = i;
            }
        }

        return (resultState, candidates[indexWinner]);
    }

    function compareStrings(string memory s1, string memory s2) public pure returns (bool) {
        return keccak256(abi.encodePacked(s1)) == keccak256(abi.encodePacked(s2));
    }

    function candidateExists(string memory _candidate) private view returns (bool exists) {
        //string[] memory candidates = candidates;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (compareStrings(candidates[i], _candidate)) {
                exists = true;
                break;
            }
        }
    }

    function timeExpired() public view returns (bool) {
        return block.timestamp > i_endTime;
    }

    function getQuestion() public view returns (string memory) {
        return question;
    }

    function getState() public view returns (State) {
        return state;
    }

    function getTimeEnd() public view returns (uint256) {
        return i_endTime;
    }

    function getTimeStart() public view returns (uint256) {
        return i_startTime;
    }

    function getQuorum() public view returns (uint256) {
        return i_quorum;
    }

    function getCandidatesCount() public view returns (uint256) {
        return candidates.length;
    }

    function getCandidateVotes(string memory candidate) public view returns (uint256) {
        return candidatesVotes[candidate];
    }

    function getCandidates() public view returns (string[] memory) {
        return candidates;
    }

    function getRegisteredVoters() public view returns (address[] memory) {
        return registeredVoters;
    }

    function getVoterVoted(address voter) public view returns (bool) {
        return voters[voter].voted;
    }
}
