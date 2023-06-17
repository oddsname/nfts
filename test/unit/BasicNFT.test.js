const {network, getNamedAccounts, ethers, deployments} = require('hardhat');
const {expect, assert} = require("chai");
const {developmentChains} = require('../../hardhat-config-helper')


!developmentChains.includes(network.name)
    ? describe.skip('')
    : describe('BasicNFT', () => {
        let deployer, basicNft;

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;

            await deployments.fixture(['all']);

            basicNft = await ethers.getContract('BasicNFT', deployer);
        })

        it('should get name and symbol', async () => {
            const name = await basicNft.name();
            const symbol = await basicNft.symbol();

            assert.equal(name, "Dogie");
            assert.equal(symbol, 'DOG');
        })

        it('should get initial counter', async () => {
            const token = await basicNft.getTokenCounter();

            assert.equal(token.toString(), '1');
        })

        it('should get token uri', async () => {
            const uri = await basicNft.tokenURI(0);

            assert.equal(uri, 'ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json');
        })

        it('should increase token counter after every mint', async () => {
            const token = await basicNft.getTokenCounter();

            let tx = await basicNft.mintNft();
            await tx.wait(1);
            const token1 = await basicNft.getTokenCounter();

            assert.equal(token1.toString(), token.toNumber() + 1);

            tx = await basicNft.mintNft();
            await tx.wait(1);
            tx = await basicNft.mintNft();
            await tx.wait(1);
            const token3 = await basicNft.getTokenCounter();

            assert.equal(token3.toString(), token.toNumber() + 3);
        })
    })