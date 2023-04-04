const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { time } = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

describe("VotingEngine Unit Tests", function () {
    let votingEngContract, accounts, deployer, player, startTimeStamp

    const chainId = network.config.chainId

    const question = networkConfig[chainId]["question"]
    const candidates = networkConfig[chainId]["candidates"]
    const timeEnd = networkConfig[chainId]["timeEnd"]
    const quorum = networkConfig[chainId]["quorum"]
    let owner, voters

    beforeEach(async function () {
        accounts = await ethers.getSigners()
        deployer = accounts[0].address
        player = accounts[1].address
        owner = deployer
        voters = [deployer, player]

        await deployments.fixture(["votingEngine"])
        votingEngContract = await ethers.getContract("VotingEngine")
    })

    describe("createVoting", function () {
        it("can create a voting", async function () {
            await votingEngContract.createVoting(
                question,
                candidates,
                timeEnd,
                quorum,
                voters,
                owner
            )

            startTimeStamp = await time.latest()

            const createdVotingAddress = await votingEngContract.getVoting(0)
            const createdVoting = await ethers.getContractAt("Voting", createdVotingAddress)
            expect(await createdVoting.getQuestion()).to.eq(question)
            expect(await createdVoting.getTimeStart()).to.eq(startTimeStamp)
        })
    })

    describe("getters", function () {
        beforeEach(async function () {
            await votingEngContract.createVoting(
                question,
                candidates,
                timeEnd,
                quorum,
                voters,
                owner
            )
        })

        it("can get votings", async function () {
            const createdVotings = await votingEngContract.getVotings()
            const expectedVotings = [await votingEngContract.getVoting(0)]

            const result = createdVotings.every(function (element) {
                return expectedVotings.includes(element)
            })

            assert(result)
        })

        it("can get count", async function () {
            const actualCount = await votingEngContract.getVotingsCount()
            const expectedCount = 1
            assert.equal(actualCount, expectedCount)
        })

        it("can get question", async function () {
            const actualQuestion = await votingEngContract.getVotingQuestion(0)
            const expectedQuestion = question
            assert.equal(actualQuestion, expectedQuestion)
        })
    })
})
