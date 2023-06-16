const {network, getNamedAccounts, ethers, deployments} = require('hardhat');
const {expect, assert} = require("chai");
const {developmentChains} = require('../../hardhat-config-helper')

const lowImgUri = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8c3ZnIHdpZHRoPSIxMDI0cHgiIGhlaWdodD0iMTAyNHB4IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGZpbGw9IiMzMzMiIGQ9Ik01MTIgNjRDMjY0LjYgNjQgNjQgMjY0LjYgNjQgNTEyczIwMC42IDQ0OCA0NDggNDQ4IDQ0OC0yMDAuNiA0NDgtNDQ4Uzc1OS40IDY0IDUxMiA2NHptMCA4MjBjLTIwNS40IDAtMzcyLTE2Ni42LTM3Mi0zNzJzMTY2LjYtMzcyIDM3Mi0zNzIgMzcyIDE2Ni42IDM3MiAzNzItMTY2LjYgMzcyLTM3MiAzNzJ6Ii8+CiAgPHBhdGggZmlsbD0iI0U2RTZFNiIgZD0iTTUxMiAxNDBjLTIwNS40IDAtMzcyIDE2Ni42LTM3MiAzNzJzMTY2LjYgMzcyIDM3MiAzNzIgMzcyLTE2Ni42IDM3Mi0zNzItMTY2LjYtMzcyLTM3Mi0zNzJ6TTI4OCA0MjFhNDguMDEgNDguMDEgMCAwIDEgOTYgMCA0OC4wMSA0OC4wMSAwIDAgMS05NiAwem0zNzYgMjcyaC00OC4xYy00LjIgMC03LjgtMy4yLTguMS03LjRDNjA0IDYzNi4xIDU2Mi41IDU5NyA1MTIgNTk3cy05Mi4xIDM5LjEtOTUuOCA4OC42Yy0uMyA0LjItMy45IDcuNC04LjEgNy40SDM2MGE4IDggMCAwIDEtOC04LjRjNC40LTg0LjMgNzQuNS0xNTEuNiAxNjAtMTUxLjZzMTU1LjYgNjcuMyAxNjAgMTUxLjZhOCA4IDAgMCAxLTggOC40em0yNC0yMjRhNDguMDEgNDguMDEgMCAwIDEgMC05NiA0OC4wMSA0OC4wMSAwIDAgMSAwIDk2eiIvPgogIDxwYXRoIGZpbGw9IiMzMzMiIGQ9Ik0yODggNDIxYTQ4IDQ4IDAgMSAwIDk2IDAgNDggNDggMCAxIDAtOTYgMHptMjI0IDExMmMtODUuNSAwLTE1NS42IDY3LjMtMTYwIDE1MS42YTggOCAwIDAgMCA4IDguNGg0OC4xYzQuMiAwIDcuOC0zLjIgOC4xLTcuNCAzLjctNDkuNSA0NS4zLTg4LjYgOTUuOC04OC42czkyIDM5LjEgOTUuOCA4OC42Yy4zIDQuMiAzLjkgNy40IDguMSA3LjRINjY0YTggOCAwIDAgMCA4LTguNEM2NjcuNiA2MDAuMyA1OTcuNSA1MzMgNTEyIDUzM3ptMTI4LTExMmE0OCA0OCAwIDEgMCA5NiAwIDQ4IDQ4IDAgMSAwLTk2IDB6Ii8+Cjwvc3ZnPgo=`;

const highImgUri = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgd2lkdGg9IjQwMCIgIGhlaWdodD0iNDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgZmlsbD0ieWVsbG93IiByPSI3OCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIi8+CiAgPGcgY2xhc3M9ImV5ZXMiPgogICAgPGNpcmNsZSBjeD0iNjEiIGN5PSI4MiIgcj0iMTIiLz4KICAgIDxjaXJjbGUgY3g9IjEyNyIgY3k9IjgyIiByPSIxMiIvPgogIDwvZz4KICA8cGF0aCBkPSJtMTM2LjgxIDExNi41M2MuNjkgMjYuMTctNjQuMTEgNDItODEuNTItLjczIiBzdHlsZT0iZmlsbDpub25lOyBzdHJva2U6IGJsYWNrOyBzdHJva2Utd2lkdGg6IDM7Ii8+Cjwvc3ZnPg==`

!developmentChains.includes(network.name)
    ? describe.skip('')
    : describe('DynamicNFT', () => {
        let dynamicNFT, deployer, priceFeed;

        beforeEach(async () => {
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

                assert.equal(lowImg, lowImgUri);
                assert.equal(highImg, highImgUri);

                const resultLowImg = await fetch(lowImgUri);
                const resultHighImg = await fetch(highImg);

                assert.equal(resultHighImg.status, 200);
                assert.equal(resultLowImg.status, 200);
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
                await new Promise(async (resolve, reject) => {
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

                await new Promise(async (resolve, reject) => {
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

        describe('test tokenURI', async () => {
            it('check revert for tokenUri', async () => {
                const tx = await dynamicNFT.mintNft(5);
                const txReceipt = await tx.wait(1);

                await expect(dynamicNFT.tokenURI(12133)).to.be.revertedWith('URI Query for nonexistent token');
            })

            it('check get lowImg', async () => {
                const result = await priceFeed.latestRoundData();
                const price = parseFloat(ethers.utils.formatEther(result.answer.toString()));

                assert.isTrue(price > 0);
                //
                await new Promise(async (resolve, reject) => {
                    dynamicNFT.once('CreatedNFT', async (tokenId, highValue) => {
                        try {
                            const base64Json = await dynamicNFT.tokenURI(tokenId.toString());
                            const response = await fetch(base64Json);
                            const result = await response.json();

                            assert.equal(result.image, lowImgUri);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    })

                    const tx = await dynamicNFT.mintNft(price - 50);
                    const txReceipt = await tx.wait(1);
                })
            });

            it('check get highImg', async () => {
                const result = await priceFeed.latestRoundData();
                const price = parseFloat(ethers.utils.formatEther(result.answer.toString()));

                assert.isTrue(price > 0);

                await new Promise(async (resolve, reject) => {
                    dynamicNFT.once('CreatedNFT', async (tokenId, highValue) => {
                        try {
                            const base64Json = await dynamicNFT.tokenURI(tokenId.toString());
                            const response = await fetch(base64Json);
                            const result = await response.json();

                            assert.equal(result.image, highImgUri);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    })

                    const tx = await dynamicNFT.mintNft(price + 50);
                    const txReceipt = await tx.wait(1);
                })
            });
        })
    });