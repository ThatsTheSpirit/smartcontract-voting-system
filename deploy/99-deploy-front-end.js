const { ethers, network } = require("hardhat")
const fs = require("fs")

const FRONT_END_ADDRESSES_FILE =
    "../nextjs-smartcontract-voting-system/constants/contractAddresses.json"
const FRONT_END_ABI_FILE = "../nextjs-smartcontract-voting-system/constants/abi.json"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end...")
        await updateContractAddresses()
        await updateAbi()
    }
}

async function updateAbi() {
    const votingEng = await ethers.getContract("VotingEngine")
    fs.writeFileSync(FRONT_END_ABI_FILE, votingEng.interface.format(ethers.utils.FormatTypes.json))
}

async function updateContractAddresses() {
    const votingEng = await ethers.getContract("VotingEngine")
    const chainId = network.config.chainId.toString()
    const currentAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8"))
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(votingEng.address)) {
            currentAddresses[chainId].push(votingEng.address)
        }
    } else {
        currentAddresses[chainId] = [votingEng.address]
    }

    fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}

module.exports.tags = ["all", "frontend"]
