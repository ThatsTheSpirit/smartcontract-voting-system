const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { time } = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

describe("VotingEngine Unit Tests", function () {
    let votingEngContract, accounts, deployer, startTimeStamp
    const chainId = network.config.chainId

    const question = networkConfig[chainId]["question"]
    const candidates = networkConfig[chainId]["candidates"]
    const duration = networkConfig[chainId]["duration"]
    const quorum = networkConfig[chainId]["quorum"]
    beforeEach(async function () {
        accounts = await ethers.getSigners()
        deployer = accounts[0]

        await deployments.fixture(["votingEngine"])
        votingEngContract = await ethers.getContract("VotingEngine")
    })

    describe("createVoting", function () {
        it("can create a voting", async function () {
            await votingEngContract.createVoting(question, candidates, duration, quorum)

            startTimeStamp = await time.latest()

            const createdVotingAddress = await votingEngContract.getVoting(0)
            const createdVoting = await ethers.getContractAt("Voting", createdVotingAddress)
            expect(await createdVoting.getQuestion()).to.eq(question)
            expect(await createdVoting.getTimeStart()).to.eq(startTimeStamp)
        })
    })
})
