const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { time } = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

describe("Voting Unit Tests", function () {
    let votingContract, accounts, deployer, player, startTimeStamp, endTimeStamp
    const chainId = network.config.chainId

    const question = networkConfig[chainId]["question"]
    const candidates = networkConfig[chainId]["candidates"]
    const duration = networkConfig[chainId]["duration"]
    const quorum = networkConfig[chainId]["quorum"]
    const voters = [deployer, player]

    beforeEach(async function () {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        player = accounts[1]
        await deployments.fixture(["voting"])
        votingContract = await ethers.getContract("Voting")

        startTimeStamp = await time.latest()
        endTimeStamp = Number(await votingContract.getTimeEnd())
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
            const expectedTimeEnd = networkConfig[chainId]["timeEnd"]
            assert.equal(actualTimeEnd.toNumber(), expectedTimeEnd)

            const actualState = await votingContract.getState()
            const expectedState = 0
            assert.equal(actualState, expectedState)

            const actualQuorum = await votingContract.getQuorum()
            assert.equal(actualQuorum, quorum)
        })

        it("register voters", async function () {
            const actualRegisteredVoters = await votingContract.getRegisteredVoters()
            const expectedRegistered = [accounts[0].address, accounts[1].address]

            const result = actualRegisteredVoters.every(function (element) {
                return expectedRegistered.includes(element)
            })
            assert(result)
        })
    })

    // describe.skip("registerVoter", function () {
    //     let voterAddress
    //     beforeEach(async function () {
    //         voterAddress = accounts[1].address
    //     })

    //     it("can register a voter", async function () {
    //         await votingContract.registerVoter(voterAddress)
    //         const actualRegistered = (await votingContract.voters(voterAddress)).registered
    //         assert.equal(actualRegistered, true)

    //         const actualRegisteredVoter = (await votingContract.getRegisteredVoters())[0]
    //         assert.equal(actualRegisteredVoter, voterAddress)
    //     })

    //     it("emits an event", async function () {
    //         await expect(votingContract.registerVoter(voterAddress))
    //             .to.emit(votingContract, "VoterRegistered")
    //             .withArgs(voterAddress)
    //     })

    //     it("reverts if voter already registered", async function () {
    //         await votingContract.registerVoter(voterAddress)
    //         await expect(votingContract.registerVoter(voterAddress)).to.be.revertedWith(
    //             "Voting__AlreadyRegistered"
    //         )
    //     })

    //     it("reverts if time expired", async function () {
    //         const timeEnd = (await votingContract.getTimeEnd()).toNumber()
    //         await time.increaseTo(timeEnd + 1)
    //         await expect(votingContract.registerVoter(voterAddress)).to.be.revertedWith(
    //             "Voting__TimeExpired"
    //         )
    //     })

    //     it("reverts if state isn't correct", async function () {
    //         await votingContract.launchCalculation()

    //         await expect(votingContract.registerVoter(voterAddress)).to.be.revertedWith(
    //             "Voting__WrongState"
    //         )
    //     })
    // })

    // describe.skip("registerVoters", function () {
    //     it("can register many voters", async function () {
    //         const addresses = accounts.map((acc) => acc.address)
    //         await votingContract.registerVoters(addresses)

    //         const expectedState = 0
    //         const actualState = await votingContract.getState()
    //         assert.equal(expectedState, actualState)

    //         const actualRegisteredVoters = await votingContract.getRegisteredVoters()
    //         const result = actualRegisteredVoters.every(function (element) {
    //             return addresses.includes(element)
    //         })
    //         assert(result)
    //     })
    // })

    describe("voteFor", function () {
        let voters
        const candidateYes = "yes",
            candidateNo = "no"
        beforeEach(async function () {
            voters = accounts.slice(0, 3).map((acc) => acc.address)
            //await votingContract.registerVoters(voters)
        })
        it("can vote for some candidate", async function () {
            await votingContract.voteFor(candidateYes)
            const actualVotedCount = await votingContract.getCandidateVotes(candidateYes)
            assert.equal(actualVotedCount.toNumber(), 1)

            const actualVoted = await votingContract.getVoterVoted(voters[0])
            assert.equal(actualVoted, true)
        })

        it("emits the VoterVoted event", async function () {
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

        it("reverts if state isn't STARTED", async function () {
            await votingContract.launchCalculation()
            await expect(votingContract.voteFor(candidateYes)).to.be.revertedWith(
                "Voting__WrongState"
            )
        })

        it("reverts if candidate doesn't exist", async function () {
            const unexistentCandidate = "some unexistent person"
            await expect(votingContract.voteFor(unexistentCandidate)).to.be.revertedWith(
                "Voting__CandidateNotFound"
            )
        })

        it("reverts when time expired", async function () {
            await time.increaseTo(endTimeStamp + 1)
            await expect(votingContract.voteFor(candidateYes)).to.be.revertedWith(
                "Voting__TimeExpired"
            )
        })
    })

    describe("defWinner", function () {
        let voters
        const candidateYes = "yes",
            candidateNo = "no"
        beforeEach(async function () {
            voters = accounts.slice(0, 3).map((acc) => acc.address)
        })

        it("reverts if state isn't correct", async function () {
            await votingContract.defWinner()
            await expect(votingContract.defWinner()).to.be.revertedWith("Voting__WrongState")
        })

        it("defines the winner if quorum achieved", async function () {
            const acc1Connected = await votingContract.connect(accounts[0])
            await acc1Connected.voteFor(candidateYes)

            const acc2Connected = await votingContract.connect(accounts[1])
            await acc2Connected.voteFor(candidateNo)

            //const acc3Connected = await votingContract.connect(accounts[2])
            //await acc3Connected.voteFor(candidateYes)

            //await votingContract.launchCalculation()

            await votingContract.defWinner()
            const winner = await votingContract.getWinner()
            assert.equal(winner, candidateYes)

            const expectedState = 2
            expect(await votingContract.getState()).to.eq(expectedState)
        })

        it("can't define the winner if quorum didn't achieve", async function () {
            await votingContract.defWinner()
            const winner = await votingContract.getWinner()
            assert.equal(winner, "")
        })

        it("can change state to ENDED", async function () {
            const player = accounts[1].address
            await votingContract.defWinner()

            const expectedState = 2
            const actualState = await votingContract.getState()
            assert.equal(expectedState, actualState)
        })

        it("reverts if address is not whitelisted", async function () {
            const acc2Connected = await votingContract.connect(accounts[1])
            await expect(acc2Connected.defWinner()).to.be.revertedWith("Voting__NotWhitelisted")
        })

        it("emits the VotingClosed event", async function () {
            await expect(votingContract.defWinner()).to.emit(votingContract, "VotingClosed")
        })
    })

    describe("Getters", function () {
        describe("compareStrings", function () {
            it("compareStrings to true", async function () {
                assert(await votingContract.compareStrings("abc", "abc"))
            })

            it("compareStrings to false", async function () {
                assert.equal(await votingContract.compareStrings("abc1", "abc"), false)
            })
        })

        describe("candidateExists", function () {
            it("returns false if candidate doesn't exist", async function () {
                assert.equal(await votingContract.candidateExists("0x"), false)
            })

            it("returns true if candidate exists", async function () {
                assert(await votingContract.candidateExists(candidates[0]))
            })
        })

        describe("timeExpired", function () {
            it("returns false if time didn't expire", async function () {
                assert.equal(await votingContract.timeExpired(), false)
            })

            it("returns true if time expired", async function () {
                await time.increaseTo(endTimeStamp + 1)
                assert(await votingContract.timeExpired())
            })
        })

        it("getQuestion", async function () {
            assert.equal(await votingContract.getQuestion(), question)
        })

        it("getState", async function () {
            assert.equal(await votingContract.getState(), 0)
        })

        it("getTimeEnd", async function () {
            assert.equal(await votingContract.getTimeEnd(), endTimeStamp)
        })

        it("getTimeStart", async function () {
            assert.equal(await votingContract.getTimeStart(), startTimeStamp)
        })

        it("getQuorum", async function () {
            assert.equal(await votingContract.getQuorum(), quorum)
        })

        it("getCandidatesCount", async function () {
            assert.equal(await votingContract.getCandidatesCount(), candidates.length)
        })

        it("getCandidates", async function () {
            const actualCandidates = await votingContract.getCandidates()
            let result = candidates.every((element) => actualCandidates.includes(element))
            assert(result)
        })

        it("getRegisteredVoters", async function () {
            const actualRegisteredVoters = await votingContract.getRegisteredVoters()
            const { deployer, player } = await getNamedAccounts()
            let result = [deployer, player].every((element) =>
                actualRegisteredVoters.includes(element)
            )
            assert(result)
        })

        describe("getVoterVoted", function () {
            it("returns false if voter didn't vote", async function () {
                assert.equal(await votingContract.getVoterVoted(deployer.address), false)
            })

            it("returns true if voter voted", async function () {
                await votingContract.voteFor(candidates[0])
                assert(await votingContract.getVoterVoted(deployer.address))
            })
        })

        describe("getCandidateVotes", function () {
            it("returns 0 if candidate has no votes", async function () {
                const actualVotes = await votingContract.getCandidateVotes(candidates[0])
                assert.equal(actualVotes, 0)
            })

            it("returns count of votes if candidate has votes", async function () {
                await votingContract.voteFor(candidates[0])
                const actualVotes = await votingContract.getCandidateVotes(candidates[0])
                assert.equal(actualVotes, 1)
            })
        })

        describe("getWinner", function () {
            it("returns empty string when quorum didn't achieve", async function () {
                assert.equal(await votingContract.getWinner(), "")
            })

            it("returns winner string when quorum achieved", async function () {
                await votingContract.voteFor(candidates[0])
                await votingContract.defWinner()
                assert.equal(await votingContract.getWinner(), candidates[0])
            })
        })

        describe("getQuorumPercent", function () {
            it("returns 0 if no one voted", async function () {
                let actualQuorumPercent = await votingContract.getQuorumPercent()
                assert.equal(actualQuorumPercent, 0)
            })

            it("returns a quorum if at least 1 user voted", async function () {
                await votingContract.voteFor(candidates[0])
                const actualQuorumPercent = await votingContract.getQuorumPercent()
                assert.equal(actualQuorumPercent.toNumber(), 50)
            })
        })

        describe("quorumAchieved", function () {
            it("returns false if quorum didn't achieve", async function () {
                let actualQuorumAchieved = await votingContract.quorumAchieved()
                assert.equal(actualQuorumAchieved, false)
            })

            it("returns true if quorum achieved", async function () {
                await votingContract.voteFor(candidates[0])
                const actualQuorumAchieved = await votingContract.quorumAchieved()
                assert(actualQuorumAchieved)
            })
        })
    })
})
