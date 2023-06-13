const {developmentChains} = require("../../hardhat-config-helper");
const {network, getNamedAccounts, deployments, ethers} = require("hardhat");
const {assert} = require("chai");

!developmentChains.includes(network.name)
    ? describe.skip('')
    : describe('Random IPFS NFT tests', () => {
        let deployer, randomNFT, vrfCoordinator;

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;

            await deployments.fixture(['all']);

            randomNFT = await ethers.getContract('RandomIPFS_NFT', deployer);
            vrfCoordinator = await ethers.getContract('VRFCoordinatorV2Mock', deployer);
        })

        describe('constructor', async () => {
            it('initializes the contract correctly', async () => {
                const lotteryState = await randomNFT.getTokenCounter();

                assert.equal(lotteryState.toString(), '0', "on init token counter must be 0");
            })
        })
    });