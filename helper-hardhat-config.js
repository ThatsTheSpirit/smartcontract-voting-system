const { ethers } = require("hardhat")

const networkConfig = {
    5: {
        name: "goerli",
        question: "Do you like goerli?",
        candidates: ["yes", "no"],
        timeEnd: new Date().getTime() + 2 * 60,
        quorum: 50, //%
    },
    80001: {
        name: "mumbai",
        question: "Do you like mumbai?",
        candidates: ["yes", "no"],
        timeEnd: new Date().getTime() + 2 * 60,
        quorum: 50, //%
    },
    31337: {
        name: "hardhat",
        question: "Do you like hardhat?",
        candidates: ["yes", "no"],
        timeEnd: new Date().getTime() + 2 * 60,
        quorum: 50, //%
    },
    11155111: {
        name: "sepolia",
        question: "Do you like sepolia?",
        candidates: ["yes", "no"],
        timeEnd: new Date().getTime() + 2 * 60,
        quorum: 50, //%
    },
}

const developmentChains = ["hardhat", "localhost"]
module.exports = { networkConfig, developmentChains }
