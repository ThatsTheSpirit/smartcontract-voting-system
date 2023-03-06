const { ethers } = require("hardhat")

const networkConfig = {
    5: {
        name: "goerli",
        question: "Do you like goerli?",
        candidates: ["yes", "no"],
        duration: 60 * 2,
        quorum: 50, //%
    },
    80001: {
        name: "mumbai",
        question: "Do you like mumbai?",
        candidates: ["yes", "no"],
        duration: 60 * 2,
        quorum: 50, //%
    },
    31337: {
        name: "hardhat",
        question: "Do you like hardhat?",
        candidates: ["yes", "no"],
        duration: 60 * 2,
        quorum: 50, //%
    },
}

const developmentChains = ["hardhat", "localhost"]
module.exports = { networkConfig, developmentChains }
