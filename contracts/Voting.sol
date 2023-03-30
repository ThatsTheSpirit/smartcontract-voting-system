// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

error Voting__AlreadyRegistered();
error Voting__AlreadyVoted();
error Voting__WrongState();
error Voting__NotRegistered();
error Voting__CandidateNotFound();
error Voting__TimeExpired();
error Voting__NotWhitelisted();

contract Voting is Ownable {
    struct Voter {
        bool registered;
        bool voted;
    }

    enum State {
        STARTED,
        CALCULATING,
        ENDED
    }

    uint256 private immutable i_startTime;
    uint256 private immutable i_timeEnd;
    uint256 public immutable i_quorum; //percent of voted
    uint256 private votedCount; //count of already voted
    State private state;
    bool public isQuorum;
    string private question;
    string[] private candidates;
    address[] private registeredVoters;
    mapping(string => uint256) public candidatesVotes;
    mapping(address => Voter) public voters;
    mapping(address => bool) whitelisted;
    string private winner;

    event VoterRegistered(address indexed voter);
    event VoterVoted(address indexed voter, string candidate);
    event VotingClosed();

    constructor(
        /* uint _startTime,*/
        /*uint _timeEnd,*/
        string memory _question,
        string[] memory _candidates,
        uint256 _timeEnd,
        uint256 _quorum,
        address[] memory _voters,
        address _newOwner
    ) {
        transferOwnership(_newOwner);
        i_startTime = block.timestamp;
        i_timeEnd = _timeEnd;
        i_quorum = _quorum;
        question = _question;
        candidates = _candidates;
        state = State.STARTED;
        whitelisted[msg.sender] = true;
        registeredVoters = _voters;
        for (uint256 i = 0; i < _voters.length; i++) {
            address voter = _voters[i];
            voters[voter].registered = true;
            //registeredVoters.push(voter);
            emit VoterRegistered(voter);
        }
        //registerVoters(_voters);
        //need to register voters
    }

    modifier onlyRegistered() {
        if (!voters[msg.sender].registered) {
            revert Voting__NotRegistered();
        }
        _;
    }

    modifier onlyWhitelisted() {
        if (!whitelisted[msg.sender]) {
            revert Voting__NotWhitelisted(); //
        }
        _;
    }

    function registerVoter(address _voter) private /*onlyOwner*/ {
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

    function registerVoters(address[] memory _voters) private /*onlyOwner*/ {
        for (uint256 i = 0; i < _voters.length; i++) {
            registerVoter(_voters[i]);
        }
    }

    function voteFor(string memory _candidate) public onlyRegistered {
        if (voters[msg.sender].voted) {
            revert Voting__AlreadyVoted();
        }
        if (state != State.STARTED) {
            revert Voting__WrongState();
        }

        if (!candidateExists(_candidate)) {
            revert Voting__CandidateNotFound();
        }

        if (timeExpired()) {
            revert Voting__TimeExpired();
        }
        ++candidatesVotes[_candidate];
        voters[msg.sender].voted = true;
        emit VoterVoted(msg.sender, _candidate);
    }

    function launchCalculation() public onlyWhitelisted {
        state = State.CALCULATING;
        emit VotingClosed();
    }

    function addToWhitelist(address _addr) public onlyOwner {
        whitelisted[_addr] = true;
    }

    function getQuorumPercent() private view returns (uint256) {
        uint256 voted = 0; //registered * 100 / voted
        for (uint256 i = 0; i < registeredVoters.length; i++) {
            if (voters[registeredVoters[i]].voted) {
                voted++;
            }
        }
        if (voted != 0) {
            return (registeredVoters.length * 100) / voted;
        }
        return voted;
    }

    function quorumArchieved() private view returns (bool) {
        return getQuorumPercent() >= i_quorum;
    }

    function defWinner() public returns (bool) {
        if (state != State.CALCULATING) {
            revert Voting__WrongState();
        }

        state = State.ENDED;

        if (quorumArchieved()) {
            isQuorum = true;

            uint256 maxVotes = 0;
            uint256 indexWinner = 0;
            for (uint256 i = 0; i < candidates.length; i++) {
                if (candidatesVotes[candidates[i]] > maxVotes) {
                    maxVotes = candidatesVotes[candidates[i]];
                    indexWinner = i;
                }
            }

            winner = candidates[indexWinner];
            return true;
        }
        return false;
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
        return block.timestamp >= i_timeEnd;
    }

    function getWinner() public view returns (string memory) {
        return winner;
    }

    function getQuestion() public view returns (string memory) {
        return question;
    }

    function getState() public view returns (State) {
        return state;
    }

    function getTimeEnd() public view returns (uint256) {
        return i_timeEnd;
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
