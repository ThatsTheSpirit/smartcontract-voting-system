const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { time } = require("@nomicfoundation/hardhat-network-helpers")
const { GelatoOpsSDK, isGelatoOpsSupported } = require("@gelatonetwork/ops-sdk")

describe.only("Brick Unit Tests", function () {
    let brickContract, accounts, signer
    const chainId = network.config.chainId
    const brickContractAddress = "0x277bf2e7969F8920c3995667973e0B44bE7d441D"
    let gelatoOps
    beforeEach(async function () {
        //accounts = await ethers.getSigners()
        //deployer = accounts[0]
        //const contractFactory = await ethers.getContractFactory("Brick", deployer)
        //brickContract = await contractFactory.deploy(question, candidates, duration, quorum)
        //await brickContract.deployed()
        //startTimeStamp = await time.latest()

        if (!isGelatoOpsSupported(chainId)) {
            console.log(`Gelato Ops network not supported (${chainId})`)
            return
        }
        //signer = (await getNamedAccounts()).deployer
        signer = (await ethers.getSigners())[0]
        brickContract = await ethers.getContractAt("Brick", brickContractAddress)
        gelatoOps = new GelatoOpsSDK(chainId, signer)

        // Prepare Task data to automate
        //const counter = new Contract(COUNTER_ADDRESSES, counterAbi, signer)
        const selector = brickContract.interface.getSighash("check()")
        const resolverData = brickContract.interface.getSighash("isClosed()")

        const timeExecute = Math.floor(Date.now() / 1000) + 3 * 60
        // Create task
        const { taskId, tx } = await gelatoOps.createTask({
            execAddress: brickContract.address,
            execSelector: selector,
            resolverAddress: brickContract.address,
            //resolverData: resolverData,
            dedicatedMsgSender: true,
            name: "Automated brickContract using resolver",
            startTime: timeExecute,
            //interval: 10,
            singleExec: true,
        })

        const { address, isDeployed } = await gelatoOps.getDedicatedMsgSender()

        // const activeTasks = await gelatoOps.getActiveTasks()
        // activeTasks.forEach((task) => {
        //     console.log(`- ${task.name} (${task.taskId})`)
        // })
    })

    describe("Brick execution", function () {
        it("can execute after time", async function () {
            const opened = await brickContract.opened()
            assert(opened)
        })
    })
})
