const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { time } = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

describe("Voting Unit Tests", function () {
    let votingContract, accounts, deployer, startTimeStamp
    const chainId = network.config.chainId

    const question = networkConfig[chainId]["question"]
    const candidates = networkConfig[chainId]["candidates"]
    const duration = networkConfig[chainId]["duration"]
    const quorum = networkConfig[chainId]["quorum"]

    beforeEach(async function () {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        await deployments.fixture(["voting"])
        votingContract = await ethers.getContract("Voting")

        startTimeStamp = await time.latest()

        //console.log(`Deployed to ${votingContract.address}`)
    })

    describe("constructor", function () {
        it("initializes all variables", async function () {
            const actualQuestion = await votingContract.getQuestion()
            assert.equal(question, actualQuestion)

            const actualCandidates = await votingContract.getCandidates()
            let result = candidates.every(function (element) {
                return actualCandidates.includes(element)
            })
            assert(result)

            const actualCandidatesCount = await votingContract.getCandidatesCount()
            assert.equal(actualCandidatesCount, actualCandidates.length)

            const actualTimeStart = await votingContract.getTimeStart()
            const expectedTimeStart = await time.latest()
            assert.equal(actualTimeStart.toNumber(), expectedTimeStart)

            const actualTimeEnd = await votingContract.getTimeEnd()
            const expectedTimeEnd = expectedTimeStart + duration
            assert.equal(actualTimeEnd.toNumber(), expectedTimeEnd)

            const actualState = await votingContract.getState()
            const expectedState = 0
            assert.equal(actualState, expectedState)

            const actualQuorum = await votingContract.getQuorum()
            assert.equal(actualQuorum, quorum)
        })
    })

    describe("registerVoter", function () {
        let voterAddress
        beforeEach(async function () {
            voterAddress = accounts[1].address
        })

        it("can register a voter", async function () {
            await votingContract.registerVoter(voterAddress)
            const actualRegistered = (await votingContract.voters(voterAddress)).registered
            assert.equal(actualRegistered, true)

            const actualRegisteredVoter = (await votingContract.getRegisteredVoters())[0]
            assert.equal(actualRegisteredVoter, voterAddress)
        })

        it("emits an event", async function () {
            await expect(votingContract.registerVoter(voterAddress))
                .to.emit(votingContract, "VoterRegistered")
                .withArgs(voterAddress)
        })

        it("reverts if voter already registered", async function () {
            await votingContract.registerVoter(voterAddress)
            await expect(votingContract.registerVoter(voterAddress)).to.be.revertedWith(
                "Voting__AlreadyRegistered"
            )
        })

        it("reverts if time expired", async function () {
            const timeEnd = (await votingContract.getTimeEnd()).toNumber()
            await time.increaseTo(timeEnd + 1)
            await expect(votingContract.registerVoter(voterAddress)).to.be.revertedWith(
                "Voting__TimeExpired"
            )
        })

        it("reverts if state isn't correct", async function () {
            //const addresses = accounts.slice(2, 4).map((acc) => acc.address)
            //await votingContract.registerVoters(addresses)
            await votingContract.launchCalculation()

            await expect(votingContract.registerVoter(voterAddress)).to.be.revertedWith(
                "Voting__WrongState"
            )
        })
    })

    describe("registerVoters", function () {
        it("can register many voters", async function () {
            const addresses = accounts.map((acc) => acc.address)
            await votingContract.registerVoters(addresses)

            const expectedState = 1
            const actualState = await votingContract.getState()
            assert.equal(expectedState, actualState)

            const actualRegisteredVoters = await votingContract.getRegisteredVoters()
            const result = actualRegisteredVoters.every(function (element) {
                return addresses.includes(element)
            })
            assert(result)
        })
    })

    describe("voteFor", function () {
        let voters
        const candidateYes = "yes",
            candidateNo = "no"
        beforeEach(async function () {
            voters = accounts.slice(0, 3).map((acc) => acc.address)
            await votingContract.registerVoters(voters)
        })
        it("can vote for some candidate", async function () {
            await votingContract.voteFor(candidateYes)
            const actualVotedCount = await votingContract.getCandidateVotes(candidateYes)
            assert.equal(actualVotedCount.toNumber(), 1)

            const actualVoted = await votingContract.getVoterVoted(voters[0])
            assert.equal(actualVoted, true)
        })

        it("emits an event", async function () {
            await expect(votingContract.voteFor(candidateYes))
                .to.emit(votingContract, "VoterVoted")
                .withArgs(voters[0], candidateYes)
        })

        it("reverts when the voter already voted", async function () {
            await votingContract.voteFor(candidateYes)
            await expect(votingContract.voteFor(candidateYes)).to.be.revertedWith(
                "Voting__AlreadyVoted"
            )
        })

        it("reverts when time expired", async function () {
            await time.increaseTo(startTimeStamp + duration)
            await expect(votingContract.voteFor(candidateYes)).to.be.revertedWith(
                "Voting__TimeExpired"
            )
        })

        it("reverts if state isn't correct", async function () {
            await votingContract.launchCalculation()
            await expect(votingContract.voteFor(candidateYes)).to.be.revertedWith(
                "Voting__WrongState"
            )
        })
    })
})
