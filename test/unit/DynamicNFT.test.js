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
                const lowImg = await dynamicNFT.getLowImgUri();
                const highImg = await dynamicNFT.getHighImgUri();

                assert.equal(tokenCounter.toString(), '0');
                assert.equal(mock, priceFeed.address);

                assert.isTrue(
                    lowImg.startsWith('data:image/svg+xml;base64,') && highImg.startsWith('data:image/svg+xml;base64,')
                );
            });
        });

        describe('test mintNft', async () => {
            it('check with low value', async () => {
                const beforeTokenCounter = await dynamicNFT.getTokenCounter();
                const expectedTokenCounter = beforeTokenCounter.toNumber() + 1;

                const beforeTokenIdToValue = await dynamicNFT.s_tokenIdToValue(expectedTokenCounter);

                const tx = await dynamicNFT.mintNft(100);
                const txReceipt = tx.wait(1);

                const afterTokenIdToValue = await dynamicNFT.s_tokenIdToValue(expectedTokenCounter);
                const afterTokenCounter = await dynamicNFT.getTokenCounter();

                assert.equal(beforeTokenCounter.toString(), '0')
                assert.equal(beforeTokenIdToValue.toString(), '0');

                assert.equal(afterTokenCounter.toString(), expectedTokenCounter.toString());
                assert.equal(afterTokenIdToValue.toString(), '100');
            });

            it('check with high value', async () => {
                const beforeTokenCounter = await dynamicNFT.getTokenCounter();
                const expectedTokenCounter = beforeTokenCounter.toNumber() + 1;

                const beforeTokenIdToValue = await dynamicNFT.s_tokenIdToValue(expectedTokenCounter);

                const tx = await dynamicNFT.mintNft(100000000);
                const txReceipt = await tx.wait(1);

                const afterTokenIdToValue = await dynamicNFT.s_tokenIdToValue(expectedTokenCounter);
                const afterTokenCounter = await dynamicNFT.getTokenCounter();

                assert.equal(beforeTokenCounter.toString(), '0')
                assert.equal(beforeTokenIdToValue.toString(), '0');

                assert.equal(afterTokenCounter.toString(), expectedTokenCounter.toString());
                assert.equal(afterTokenIdToValue.toString(), '100000000');
            });

            it('check event emit', async () => {
                await new Promise(async(resolve, reject) => {
                    const beforeTokenCounter = await dynamicNFT.getTokenCounter();

                    dynamicNFT.once('CreatedNFT', async (tokenId, highValue) => {
                        try {
                            const afterTokenCounter = await dynamicNFT.getTokenCounter();
                            const expectedTokenCounter = beforeTokenCounter.toNumber() + 1;

                            const afterTokenIdToValue = await dynamicNFT.s_tokenIdToValue(expectedTokenCounter);

                            assert.equal(afterTokenCounter.toString(), tokenId.toString());
                            assert.equal(expectedTokenCounter.toString(), tokenId.toString());
                            assert.equal(afterTokenIdToValue.toString(), highValue.toString());
                            assert.equal(highValue.toString(), '100000000');
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    })

                    const tx = await dynamicNFT.mintNft(100000000);
                    const txReceipt = await tx.wait(1);
                })
            })

            it('check mintNft with different account', async () => {
                const accounts = await ethers.getSigners();
                const account = accounts[1];

                const connectedDynamicNFT = dynamicNFT.connect(account);

                const beforeTokenCounter = await connectedDynamicNFT.getTokenCounter();
                const expectedTokenCounter = beforeTokenCounter.toNumber() + 1;

                const beforeTokenIdToValue = await connectedDynamicNFT.s_tokenIdToValue(expectedTokenCounter);

                const tx = await connectedDynamicNFT.mintNft(10150);
                const txReceipt = tx.wait(1);

                const afterTokenIdToValue = await connectedDynamicNFT.s_tokenIdToValue(expectedTokenCounter);
                const afterTokenCounter = await connectedDynamicNFT.getTokenCounter();

                assert.equal(beforeTokenCounter.toString(), '0')
                assert.equal(beforeTokenIdToValue.toString(), '0');

                assert.equal(afterTokenCounter.toString(), expectedTokenCounter.toString());
                assert.equal(afterTokenIdToValue.toString(), '10150');
            });

            it('check event emit with different account', async () => {
                const accounts = await ethers.getSigners();
                const account = accounts[1];

                const connectedDynamicNFT = dynamicNFT.connect(account);

                await new Promise(async(resolve, reject) => {
                    const beforeTokenCounter = await dynamicNFT.getTokenCounter();

                    dynamicNFT.once('CreatedNFT', async (tokenId, highValue) => {
                        try {
                            const afterTokenCounter = await dynamicNFT.getTokenCounter();
                            const expectedTokenCounter = beforeTokenCounter.toNumber() + 1;

                            const afterTokenIdToValue = await dynamicNFT.s_tokenIdToValue(expectedTokenCounter);

                            assert.equal(afterTokenCounter.toString(), tokenId.toString());
                            assert.equal(expectedTokenCounter.toString(), tokenId.toString());
                            assert.equal(afterTokenIdToValue.toString(), highValue.toString());
                            assert.equal(highValue.toString(), '111');
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    })

                    const tx = await connectedDynamicNFT.mintNft(111);
                    const txReceipt = await tx.wait(1);
                })
            });
        });


    });