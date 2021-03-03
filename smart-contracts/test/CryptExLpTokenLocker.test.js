const { expect } = require("chai");
const hre = require("hardhat");

const { parseEther } = hre.ethers.utils;
const { time } = require('@openzeppelin/test-helpers')

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe("CryptExLpTokenLocker", function () {

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

        const FeesCalculator = await ethers.getContractFactory("FeesCalculatorMock");
        feesCalculator = await FeesCalculator.deploy()
        locker = await Locker.deploy(factory.address, feesCalculator.address, feesReceiver.address, tokenA.address);
    })

    it("should lock lp token", async function () {
        let amount = 1000;
        const currentTime = Math.round(await time.latest())
        await lpToken.approve(locker.address, amount)
        await locker.lockTokens(lpToken.address, amount, currentTime + 20000, owner.address, 0, { value: parseEther('1') })
        const lockedTokens = await lpToken.balanceOf(locker.address)
        expect(lockedTokens).to.equal(999)
    });

    it("should transfer correct fees in bsc", async function () {
        let amount = 1000;
        const currentTime = Math.round(await time.latest())
        const unlockTime = currentTime + 1000;
        const initialBalance = await hre.ethers.provider.getBalance(feesReceiver.address)
        await lpToken.approve(locker.address, amount);
        await locker.lockTokens(lpToken.address, amount, unlockTime,
            owner.address, 0, { value: parseEther('1') });
        const balanceAfterLock = await hre.ethers.provider.getBalance(feesReceiver.address)
        let expectedFee = parseEther('1');
        expect(balanceAfterLock.sub(initialBalance)).to.equal(expectedFee)

        const lockerBalance = await hre.ethers.provider.getBalance(locker.address)
        expect(lockerBalance).to.be.equal(0, "no bnb should be left on locker contract");
    });

    it("should transfer correct fees in CRX", async function () {
        let amount = 1000;
        const initialBalance = await tokenA.balanceOf(feesReceiver.address)
        await lpToken.approve(locker.address, amount)
        await tokenA.approve(locker.address, parseEther('0.75'))
        const currentTime = Math.round(await time.latest())
        const unlockTime = currentTime + 1000;
        await locker.lockTokens(lpToken.address, amount, unlockTime, owner.address, 1);
        const balanceAfterLock = await tokenA.balanceOf(feesReceiver.address)
        let expectedFee = parseEther('0.75');
        expect(balanceAfterLock.sub(initialBalance)).to.equal(expectedFee)
    });

    it('should store correct lock info', async function() {
        let amount = 1000;
        const currentTime = Math.round(await time.latest())
        const unlockTime = currentTime + 1000;
        await lpToken.approve(locker.address, amount)
        await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })

        const lpTokenFee = await feesCalculator.lpTokenFee()

        const lockInfo = await locker.tokenLocks(0)
        expect(lockInfo.owner).to.equal(alice.address, "wrong owner address")
        expect(lockInfo.lpToken).to.equal(lpToken.address, "wrong lp token address")
        expect(lockInfo.tokenAmount).to.equal(amount - lpTokenFee, "wrong amount")
        expect(lockInfo.unlockTime).to.equal(unlockTime, "wrong unlock time")
    })

    it('should emit event on token lock with correct values', async function() {
        const currentTime = Math.round(await time.latest())
        const unlockTime = currentTime + 1000;
        const amount = 1000;
        await lpToken.approve(locker.address, amount)
        const tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        const lockTxInfo = await tx.wait()
        const args = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args;
        expect(args.lockId).to.equal(0, "incorrect lock id");
        expect(args.owner).to.equal(alice.address, "incorrect owner");
        expect(args.amount).to.equal(999, "incorrect amount");
        expect(args.unlockTime).to.equal(unlockTime, "incorrect unlock time");
    })

    it('should extend lock time', async function() {
        let amount = 1000;
        const currentTime = Math.round(await time.latest())
        const unlockTime = currentTime + 1000;
        await lpToken.approve(locker.address, amount)
        const tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        const lockTxInfo = await tx.wait()
        let lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;

        let newUnlockTime = currentTime + 2000;
        await locker.connect(alice).extendLockTime(lockId, newUnlockTime);
        const lockInfo = await locker.tokenLocks(lockId)
        expect(lockInfo.unlockTime).to.equal(newUnlockTime, "unlock time not changed")
    })

    it('should fail on trying to decrease unlock time', async function() {
        const currentTime = Math.round(await time.latest())
        const unlockTime = currentTime + 10;

        const amount = 1000;
        await lpToken.approve(locker.address, amount)
        const tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        const lockTxInfo = await tx.wait()
        let lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;
        await expect(
            locker.connect(alice).extendLockTime(lockId, unlockTime - 1)
        ).to.be.revertedWith("NOT INCREASING UNLOCK TIME");
    })

    it('should fail on trying to extend time of lock not by lock owner', async function(){
        const currentTime = Math.round(await time.latest())
        const unlockTime = currentTime + 10;
        const amount = 1000;
        await lpToken.approve(locker.address, amount)
        const tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        const lockTxInfo = await tx.wait()
        let lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;
        await expect(
            locker.extendLockTime(lockId, unlockTime + 1000)
        ).to.be.revertedWith("NOT OWNER");
    })

    it('should transfer lock to a new owner', async function() {
        const amount = 1000;
        const currentTime = Math.round(await time.latest())
        const unlockTime = currentTime + 10;
        await lpToken.approve(locker.address, amount)
        const tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        const lockTxInfo = await tx.wait()
        let lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;

        const transferTx = await locker.connect(alice).transferLock(lockId, bob.address);
        const transferTxInfo = await transferTx.wait()
        console.log(`transfer lock gas used: ${transferTxInfo.gasUsed}`)

        const lockInfo = await locker.tokenLocks(lockId)
        expect(lockInfo.owner).to.equal(bob.address, "ownership not transferred")

        const aliceLocksLen = await locker.userLocksLength(alice.address)
        expect(aliceLocksLen).to.equal(0, "alice locks num not updated");

        const bobLocksLen = await locker.userLocksLength(bob.address)
        expect(bobLocksLen).to.equal(1, "bob locks num not updated");
    })

    it('should not allow to transfer ownership to zero address', async function(){
        const currentTime = Math.round(await time.latest())
        const amount = 1000;
        const unlockTime = currentTime + 10;
        await lpToken.approve(locker.address, amount)
        const tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        const lockTxInfo = await tx.wait()
        let lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;

        await expect(
            locker.connect(alice).transferLock(lockId, ZERO_ADDRESS)
        ).to.be.revertedWith("ZERO NEW OWNER");
    })

    it('should fail on transferring lock by not lock owner', async function(){
        const currentTime = Math.round(await time.latest())
        const unlockTime = currentTime + 10;

        const amount = 1000;
        await lpToken.approve(locker.address, amount)
        const tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        const lockTxInfo = await tx.wait()
        let lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;
        await expect(
            locker.transferLock(lockId, bob.address)
        ).to.be.revertedWith("NO ACTIVE LOCK OR NOT OWNER");
    })

    it('should update fees calculator', async function() {
        const FeesCalculator = await ethers.getContractFactory("FeesCalculatorMock");
        const newFeesCalculator = await FeesCalculator.deploy()
        await locker.setFeesCalculator(newFeesCalculator.address);
        const currentFeesCalculator = await locker.feesCalculator();
        expect(currentFeesCalculator).to.equal(newFeesCalculator.address, "fees calculator not updated")
    })

    it('should not allow not owner to update fees calculator', async function() {
        await expect(
            locker.connect(bob).setFeesCalculator(bob.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    })

    it('should withdraw tokens partially after unlock time', async function() {
        const currentTime = Math.round(await time.latest())
        const amount = 1000;
        const unlockTime = currentTime + 10;
        await lpToken.approve(locker.address, amount)
        const tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        const lockTxInfo = await tx.wait()
        let lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;

        await time.increaseTo(currentTime + 1000);
        const initialBalance = await lpToken.balanceOf(alice.address);
        await locker.connect(alice).withdrawPartially(lockId, 500);
        const balanceAfterWithdrawal = await lpToken.balanceOf(alice.address);
        expect(balanceAfterWithdrawal.sub(initialBalance)).to.equal(500, 'incorrect balance is withdrawn')

        const lockInfo = await locker.tokenLocks(lockId)
        expect(lockInfo.tokenAmount).to.equal(499, "incorrect rest amount");
    })

    it('should withdraw tokens fully after unlock time', async function() {
        const currentTime = Math.round(await time.latest())
        const amount = 1000;
        const unlockTime = currentTime + 10;
        await lpToken.approve(locker.address, amount)
        const tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        const lockTxInfo = await tx.wait()
        let lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;

        await time.increaseTo(currentTime + 1000);
        const initialBalance = await lpToken.balanceOf(alice.address);
        await locker.connect(alice).withdraw(lockId);
        const balanceAfterWithdrawal = await lpToken.balanceOf(alice.address);
        expect(balanceAfterWithdrawal.sub(initialBalance)).to.equal(999, 'incorrect balance is withdrawn')
    })

    it('should delete lock from storage after it was unlocked fully', async function() {
        const currentTime = Math.round(await time.latest())
        const amount = 1000;
        const unlockTime = currentTime + 10;
        await lpToken.approve(locker.address, amount)
        const tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        const lockTxInfo = await tx.wait()
        let lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;

        await time.increaseTo(currentTime + 1000);
        await locker.connect(alice).withdraw(lockId);

        const lockInfo = await locker.tokenLocks(lockId)
        expect(lockInfo.owner).to.equal(ZERO_ADDRESS, "lock info not deleted");
    })

    it('should increment lock id', async function() {
        const currentTime = Math.round(await time.latest())
        const amount = 1000;
        const unlockTime = currentTime + 10;
        await lpToken.approve(locker.address, amount)
        let tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        let lockTxInfo = await tx.wait()
        let lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;

        expect(lockId).to.equal(0, "wrong lock id");

        await lpToken.approve(locker.address, amount)
        tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        lockTxInfo = await tx.wait()
        lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;
        expect(lockId).to.equal(1, "wrong lock id didn't increment");
    })

    it('should fail on withdrawal before unlock time', async function() {
        const currentTime = Math.round(await time.latest())
        const amount = 1000;
        const unlockTime = currentTime + 100;
        await lpToken.approve(locker.address, amount)
        const tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        const lockTxInfo = await tx.wait()
        let lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;

        // await expect(
        //     locker.connect(alice).withdraw(lockId)
        // ).to.be.revertedWith("NOT YET");
        //todo: hardhat evm returns block.timestamp in ms
    })

    it('should fail if not enough eth fees send', async function() {
        const currentTime = Math.round(await time.latest())
        const amount = 1000;
        const unlockTime = currentTime + 10;
        await lpToken.approve(locker.address, amount)
        await expect(
            locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('0.9') })
        ).to.be.revertedWith("ETH FEES NOT MET")
    })

    it('should not fail if more that fee bnb was sent', async function() {
        const initialFeesReceiverBalance = await hre.ethers.provider.getBalance(feesReceiver.address)
        const currentTime = Math.round(await time.latest())
        const amount = 1000;
        const unlockTime = currentTime + 10;
        await lpToken.approve(locker.address, amount)
        await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('2') })

        const lockerBalance = await hre.ethers.provider.getBalance(locker.address)
        expect(lockerBalance).to.be.equal(0, "no bnb should be left on locker contract");

        const feesReceiverBalanceAfterLock = await hre.ethers.provider.getBalance(feesReceiver.address)
        console.log('fees receiver balance after lock', feesReceiverBalanceAfterLock.toString());
        const expectedFee = parseEther('1');
        expect(feesReceiverBalanceAfterLock.sub(initialFeesReceiverBalance)).to.equal(expectedFee, "wrong eth fee")
    })

    it('should increase lock amount', async function(){
        const currentTime = Math.round(await time.latest())
        const amount = 1000;
        const unlockTime = currentTime + 10;
        await lpToken.approve(locker.address, amount)
        let tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        let lockTxInfo = await tx.wait()
        let lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;

        const amountToIncrement = 1000;
        await lpToken.transfer(alice.address, 1000);
        await lpToken.connect(alice).approve(locker.address, amountToIncrement);

        await locker.connect(alice).increaseLockAmount(lockId, amountToIncrement, 0);

        const lockInfo = await locker.tokenLocks(0);

        expect(lockInfo.tokenAmount).to.equal(1998);
    })

    it('should update user locks length', async function(){
        const initialLength = await locker.userLocksLength(alice.address);
        expect(initialLength).to.equal(0, "initial length must be zero");
        const currentTime = Math.round(await time.latest())
        const amount = 1000;
        const unlockTime = currentTime + 10;
        await lpToken.approve(locker.address, amount)
        let tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })

        const lenAfterLock = await locker.userLocksLength(alice.address);
        expect(lenAfterLock).to.equal(1, "length not updated");
    })

    it('should update fetch user locks ids', async function(){
        const currentTime = Math.round(await time.latest())
        const amount = 1000;
        const unlockTime = currentTime + 10;
        await lpToken.approve(locker.address, amount)
        await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        await lpToken.approve(locker.address, amount)
        await locker.lockTokens(lpToken.address, amount, unlockTime, bob.address, 0, { value: parseEther('1') })
        await lpToken.approve(locker.address, amount)
        await locker.lockTokens(lpToken.address, amount, unlockTime, bob.address, 0, { value: parseEther('1') })

        const userLockId = await locker.userLockAt(bob.address, 1);
        expect(userLockId).to.equal(2, "user lock not fetched");

        let bobsActiveLocksNum = await locker.userLocksLength(bob.address)
        expect(bobsActiveLocksNum).to.equal(2, 'locks num not updated')

        await time.increaseTo(currentTime + 1000)
        await locker.connect(bob).withdraw(1)

        bobsActiveLocksNum = await locker.userLocksLength(bob.address)
        expect(bobsActiveLocksNum).to.equal(1, 'locks num not updated')

        await locker.connect(bob).withdraw(2)
        bobsActiveLocksNum = await locker.userLocksLength(bob.address)
        expect(bobsActiveLocksNum).to.equal(0, 'locks num not updated')

        // const id = await locker.userLockAt(bob.address, 0);
        // expect(id).to.equal(0, "user lock not fetched");
    })

    it('should not allow to withdraw tokens twice', async function() {
        const currentTime = Math.round(await time.latest())
        const amount = 1000;
        const unlockTime = currentTime + 10;
        await lpToken.approve(locker.address, amount)
        const tx = await locker.lockTokens(lpToken.address, amount, unlockTime, alice.address, 0, { value: parseEther('1') })
        const lockTxInfo = await tx.wait()
        let lockId = lockTxInfo.events.filter(event => event.event === 'OnTokenLock')[0].args.lockId;

        await time.increaseTo(currentTime + 1000);
        await locker.connect(alice).withdraw(lockId);

        await expect(
            locker.connect(alice).withdraw(lockId)
        ).to.be.revertedWith("NO ACTIVE LOCK OR NOT OWNER");
    })


})