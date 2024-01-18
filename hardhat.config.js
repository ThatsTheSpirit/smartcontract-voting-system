require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "https://eth-goerli"
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL || "https://eth-mumbai"
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia"
const BSCTESTNET_RPC_URL = process.env.BSCTESTNET_RPC_URL || "https://bsc-testnet"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xkey"
const MUMBAI_API = process.env.MUMBAI_API || "0xkey"
const SEPOLIA_INFURA = process.env.SEPOLIA_INFURA || "0xkey"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "0xkey"

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.17",
    settings: {
        optimizer: { enabled: process.env.DEBUG ? false : true },
    },
    etherscan: {
        apiKey: {
            polygonMumbai: MUMBAI_API,
            sepolia: ETHERSCAN_API_KEY,
        },
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS ? true : false,
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        goerli: {
            chainId: 5,
            blockConfirmations: 6,
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY],
        },
        sepolia: {
            chainId: 11155111,
            blockConfirmations: 6,
            url: SEPOLIA_INFURA,
            accounts: [PRIVATE_KEY],
        },
        mumbai: {
            chainId: 80001,
            blockConfirmations: 6,
            url: MUMBAI_RPC_URL,
            accounts: [PRIVATE_KEY],
        },
        bsctestnet: {
            chainId: 97,
            blockConfirmations: 6,
            url: BSCTESTNET_RPC_URL,
            accounts: [PRIVATE_KEY],
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
}
