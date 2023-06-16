const {network, getNamedAccounts, ethers, deployments} = require('hardhat');
const {expect, assert} = require("chai");
const {developmentChains} = require('../../hardhat-config-helper')

!developmentChains.includes(network.name)
    ? describe.skip('')
    : describe('DynamicNFT', () => {
        let dynamicNFT, deployer, priceFeed;

        beforeEach(async() => {
            deployer = (await getNamedAccounts()).deployer

            await deployments.fixture(['mocks', 'dynamic-nft']);

            dynamicNFT = await ethers.getContract('DynamicNFT', deployer)
            priceFeed = await ethers.getContract('MockV3Aggregator', deployer);
        })

        describe('constructor', async () => {
            it('check initial contract params', async () => {
                const tokenCounter = await dynamicNFT.getTokenCounter();
                const mock = await dynamicNFT.getPriceFeed();

                assert.equal(tokenCounter, '0');
                assert.equal(mock, priceFeed.address);
            });

        });


    });