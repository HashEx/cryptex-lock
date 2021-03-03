const { expect } = require("chai");
const hre = require("hardhat");
const { time } = require('@openzeppelin/test-helpers')

const { parseEther } = hre.ethers.utils;

describe("Fees Calculator", function () {

    let owner;
    let alice;
    let locker;
    let tokenA;
    let tokenB;
    let lpToken;
    let feesReceiver;
    let feesCalculator;

    beforeEach(async function () {
        const Locker = await ethers.getContractFactory("CryptExLpTokenLocker");
        [owner, alice, bob, feesReceiver] = await ethers.getSigners();

        const PancakeFactory = await ethers.getContractFactory("PancakeFactory");
        const factory = await PancakeFactory.deploy(owner.address);

        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");

        const initialBalance = parseEther('2000');

        tokenA = await ERC20Mock.deploy("tokenA", "A", owner.address, initialBalance);
        tokenB = await ERC20Mock.deploy("tokenB", "B", owner.address, initialBalance);

        const tx = await factory.createPair(tokenA.address, tokenB.address);

        const txData = await tx.wait()
        const lpTokenAddress = txData.events[0].args.pair

        const PancakePair = await ethers.getContractFactory("PancakePair")
        lpToken = await PancakePair.attach(lpTokenAddress)
        await tokenA.transfer(lpToken.address, initialBalance.div('2'))
        await tokenB.transfer(lpToken.address, initialBalance.div('2'))
        await lpToken.mint(owner.address)

        const FeesCalculator = await ethers.getContractFactory("FeesCalculator");
        feesCalculator = await FeesCalculator.deploy();

        locker = await Locker.deploy(factory.address, feesCalculator.address, feesReceiver.address, tokenA.address);
    })

    it("should transfer correct fees in progressive bsc", async function () {
        const currentTime = Math.round(await time.latest())
        const unlockTime = currentTime + 10;
        const amount = 1000;

        const initialBalance = await hre.ethers.provider.getBalance(feesReceiver.address)
        const initialLPBalance = await lpToken.balanceOf(feesReceiver.address)
        await lpToken.approve(locker.address, amount);
        const lockCRXpLP = await locker.lockTokens(lpToken.address, amount, unlockTime,
            owner.address, 0, { value: parseEther('1.01') });
        const txInfo = await lockCRXpLP.wait()
        console.log(`lock method0 gas: ${txInfo.gasUsed}`)
        const balanceAfterLock = await hre.ethers.provider.getBalance(feesReceiver.address)
        const balanceLPAfterLock = await lpToken.balanceOf(feesReceiver.address)
        let fees = await feesCalculator.getFees();
        let expectedFee = fees[0];
        let expectedLPFee = fees[4].mul(amount).div(10000);
        expect(balanceAfterLock.sub(initialBalance)).to.equal(expectedFee)
        expect(balanceLPAfterLock.sub(initialLPBalance)).to.equal(expectedLPFee)
    });

    it("should transfer correct fees in progressive CRX", async function () {
        const currentTime = Math.round(await time.latest())
        const unlockTime = currentTime + 10;
        const amount = 1000;

        const initialBalance = await tokenA.balanceOf(feesReceiver.address)
        const initialLPBalance = await lpToken.balanceOf(feesReceiver.address)
        await lpToken.approve(locker.address, amount)
        await tokenA.approve(locker.address, parseEther('4.51'))
        const lockCRXpLP = await locker.lockTokens(lpToken.address, amount, unlockTime, owner.address, 1);
        const txInfo = await lockCRXpLP.wait()
        console.log(`lock method1 gas: ${txInfo.gasUsed}`)
        const balanceAfterLock = await tokenA.balanceOf(feesReceiver.address)
        const balanceLPAfterLock = await lpToken.balanceOf(feesReceiver.address)
        let fees = await feesCalculator.getFees();
        let expectedFee = fees[1];
        let expectedLPFee = fees[4].mul(amount).div(10000);
        expect(balanceAfterLock.sub(initialBalance)).to.equal(expectedFee)
        expect(balanceLPAfterLock.sub(initialLPBalance)).to.equal(expectedLPFee)
    });

    it("should transfer correct fees in flat bsc", async function () {
        const currentTime = Math.round(await time.latest())
        const unlockTime = currentTime + 10;
        const amount = 1000;

        const initialBalance = await hre.ethers.provider.getBalance(feesReceiver.address)
        const initialLPBalance = await lpToken.balanceOf(feesReceiver.address)
        await lpToken.approve(locker.address, amount);
        const lockCRXpLP = await locker.lockTokens(lpToken.address, amount, unlockTime,
            owner.address, 2, { value: parseEther('23.01') });
        const txInfo = await lockCRXpLP.wait()
        console.log(`lock method2 gas: ${txInfo.gasUsed}`)
        const balanceAfterLock = await hre.ethers.provider.getBalance(feesReceiver.address)
        const balanceLPAfterLock = await lpToken.balanceOf(feesReceiver.address)
        let fees = await feesCalculator.getFees();
        let expectedFee = fees[2];
        let expectedLPFee = 0;
        expect(balanceAfterLock.sub(initialBalance)).to.equal(expectedFee)
        expect(balanceLPAfterLock.sub(initialLPBalance)).to.equal(expectedLPFee)
    });


    it('should update fees in calculator', async function() {
        const FeesCalculator = await ethers.getContractFactory("FeesCalculatorMock");
        const newFeesCalculator = await FeesCalculator.deploy()
        await locker.setFeesCalculator(newFeesCalculator.address);
        const currentFeesCalculator = await locker.feesCalculator();
        expect(currentFeesCalculator).to.equal(newFeesCalculator.address, "fees calculator not updated")
    })


})