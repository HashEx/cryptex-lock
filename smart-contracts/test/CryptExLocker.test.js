const { expect } = require("chai");
const hre = require("hardhat");

describe("CryptExLocker", function () {

    let owner;
    let alice;
    let pancakeSwapLocker;
    let pair;
    let tokenA;
    let tokenB;
    let lpToken;
    let devAddr;

    beforeEach(async function () {
        const PancakeSwapLocker = await ethers.getContractFactory("CryptExLocker");
        [owner, alice, devAddr] = await ethers.getSigners();

        const PancakeFactory = await ethers.getContractFactory("PancakeFactory");
        const factory = await PancakeFactory.deploy(owner.address);

        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");

        const initialBalance = 100000;

        tokenA = await ERC20Mock.deploy("tokenA", "A", owner.address, initialBalance);
        tokenB = await ERC20Mock.deploy("tokenB", "B", owner.address, initialBalance);

        const tx = await factory.createPair(tokenA.address, tokenB.address);

        const txData = await tx.wait()
        const lpTokenAddress = txData.events[0].args.pair

        const PancakePair = await ethers.getContractFactory("PancakePair")
        lpToken = await PancakePair.attach(lpTokenAddress)
        await tokenA.transfer(lpToken.address, initialBalance)
        await tokenB.transfer(lpToken.address, initialBalance)
        await lpToken.mint(owner.address)

        pancakeSwapLocker = await PancakeSwapLocker.deploy(factory.address);
        await pancakeSwapLocker.setDev(devAddr.address)
    })

    it("should lock lp token", async function () {
        let amount = 1000;
        await lpToken.approve(pancakeSwapLocker.address, amount);
        await pancakeSwapLocker.lockLPToken(lpToken.address, amount, 1000,
            true, owner.address, { value: '1000000000000000000' });
    });

    it("should transfer correct fees in bsc", async function () {
        let amount = 1000;
        const initialBalance = await hre.ethers.provider.getBalance(devAddr.address)
        await lpToken.approve(pancakeSwapLocker.address, amount);
        await pancakeSwapLocker.lockLPToken(lpToken.address, amount, 1000,
            true, owner.address, { value: '1000000000000000000' });
        const balanceAfterLock = await hre.ethers.provider.getBalance(devAddr.address)
        let expectedFee = ethers.utils.parseUnits('1', 18);
        expect(balanceAfterLock.sub(initialBalance)).to.equal(expectedFee)
    });

})