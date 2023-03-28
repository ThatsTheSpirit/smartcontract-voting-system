const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer, player } = await getNamedAccounts()
    //const accounts = await getNamedAccounts()
    const chainId = network.config.chainId

    const question = networkConfig[chainId]["question"]
    const candidates = networkConfig[chainId]["candidates"]
    const duration = networkConfig[chainId]["duration"]
    const quorum = networkConfig[chainId]["quorum"]
    const owner = deployer
    const voters = [deployer, player]

    const args = [question, candidates, duration, quorum, voters, owner]

    const voting = await deploy("Voting", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(voting.address, args)
    }
    log("---------------------------")
}

module.exports.tags = ["all", "voting"]
