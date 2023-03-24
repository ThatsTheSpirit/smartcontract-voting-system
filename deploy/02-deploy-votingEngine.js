const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const question = networkConfig[chainId]["question"]
    const candidates = networkConfig[chainId]["candidates"]
    const duration = networkConfig[chainId]["duration"]
    const quorum = networkConfig[chainId]["quorum"]

    const args = []

    await deploy("VotingEngine", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("Checking votings...")
    const votingEngine = await ethers.getContract("VotingEngine", deployer)
    const votingsCounts = await votingEngine.getVotingsCount()
    log(`Found ${votingsCounts} votings`)
    if (votingsCounts === 0) {
        log("Creating voting...")
        await votingEngine.createVoting(question, candidates, duration, quorum)
    }

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(votingEngine.address, args)
    }
    log("---------------------------")
}

module.exports.tags = ["all", "votingEngine"]
