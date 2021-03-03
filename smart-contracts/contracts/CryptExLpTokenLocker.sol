// SPDX-License-Identifier: UNLICENSED

// This contract locks PancakeSwap liquidity tokens. Locked liquidity cannot be removed from PancakeSwap
// until the specified unlock date has been reached.

pragma solidity 0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./pancake/interfaces/IPancakeFactory.sol";
import "./pancake/interfaces/IPancakePair.sol";
import "./IFeesCalculator.sol";

contract CryptExLpTokenLocker is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;

    IPancakeFactory public pancakeFactory;
    IFeesCalculator public feesCalculator;

    IERC20 public feeToken;
    address payable public feeReceiver;

    struct TokenLock {
        address lpToken;
        address owner;
        uint256 tokenAmount;
        uint256 unlockTime;
    }

    uint256 public lockNonce = 0;

    mapping(uint256 => TokenLock) public tokenLocks;

    mapping(address => EnumerableSet.UintSet) private userLocks;

    event OnTokenLock(
        uint256 indexed lockId,
        address indexed tokenAddress,
        address indexed owner,
        uint256 amount,
        uint256 unlockTime
    );
    event OnTokenUnlock(uint256 indexed lockId);
    event OnLockWithdrawal(uint256 indexed lockId, uint256 amount);
    event OnLockAmountIncreased(uint256 indexed lockId, uint256 amount);
    event OnLockDurationIncreased(uint256 indexed lockId, uint256 newUnlockTime);
    event OnLockOwnershipTransferred(uint256 indexed lockId, address indexed newOwner);

    modifier onlyLockOwner(uint lockId) {
        TokenLock storage lock = tokenLocks[lockId];
        require(lock.owner == address(msg.sender), "NO ACTIVE LOCK OR NOT OWNER");
        _;
    }

    constructor(IPancakeFactory _pancakeFactory, address _feesCalculator, address payable _feesReceiver,
        address _feeToken) {
        pancakeFactory = _pancakeFactory;
        feesCalculator = IFeesCalculator(_feesCalculator);
        feeReceiver = _feesReceiver;
        feeToken = IERC20(_feeToken);
    }

    /**
    * @notice locks pancake liquidity token until specified time
    * @param lpToken token address to lock
    * @param amount amount of tokens to lock
    * @param unlockTime unix time in seconds after that tokens can be withdrawn
    * @param withdrawer account that can withdraw tokens to it's balance
    * @param feePaymentMode 0 - pay fees in ETH + LP token,
    *                       1 - pay fees in CRX + LP token,
    *                       2 - pay fees fully in BNB,
    *                       3 - pay fees fully in CRX
    */
    function lockTokens(address lpToken, uint256 amount, uint256 unlockTime,
             address payable withdrawer, uint8 feePaymentMode) external payable nonReentrant returns (uint256 lockId) {
        require(amount > 0, "ZERO AMOUNT");
        require(lpToken != address(0), "ZERO TOKEN");
        require(unlockTime > block.timestamp, "UNLOCK TIME IN THE PAST");
        require(unlockTime < 10000000000, "INVALID UNLOCK TIME, MUST BE UNIX TIME IN SECONDS");
        require(checkLpTokenIsPancake(lpToken), "NOT PANCAKE PAIR");

        //pay fees
        (uint256 ethFee, uint256 tokenFee, uint256 lpTokenFee) =
            feesCalculator.calculateFees(lpToken, amount, unlockTime, feePaymentMode);
        require(lpTokenFee <= amount.div(100), "LP FEE EXCEEDS 1%"); //safeguard for lp token fee
        transferFees(lpToken, ethFee, tokenFee, lpTokenFee);
        if(msg.value > ethFee) { // transfer excess back
            transferBnb(msg.sender, msg.value.sub(ethFee));
        }

        uint256 amountToLock = amount.sub(lpTokenFee);

        TokenLock memory lock = TokenLock({
            lpToken: lpToken,
            owner: withdrawer,
            tokenAmount: amountToLock,
            unlockTime: unlockTime
        });

        lockId = lockNonce++;
        tokenLocks[lockId] = lock;

        userLocks[withdrawer].add(lockId);

        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), amountToLock);
        emit OnTokenLock(lockId, lpToken, withdrawer, amountToLock, unlockTime);
        return lockId;
    }

    function checkLpTokenIsPancake(address lpToken) private view returns (bool){
        IPancakePair pair = IPancakePair(lpToken);
        address factoryPair = pancakeFactory.getPair(pair.token0(), pair.token1());
        return factoryPair == lpToken;
    }

    /**
    * @notice increase unlock time of already locked tokens
    * @param newUnlockTime new unlock time (unix time in seconds)
    */
    function extendLockTime(uint256 lockId, uint256 newUnlockTime) external nonReentrant onlyLockOwner(lockId) {
        require(newUnlockTime > block.timestamp, "UNLOCK TIME IN THE PAST");
        require(newUnlockTime < 10000000000, "INVALID UNLOCK TIME, MUST BE UNIX TIME IN SECONDS");
        TokenLock storage lock = tokenLocks[lockId];
        require(lock.unlockTime < newUnlockTime, "NOT INCREASING UNLOCK TIME");
        lock.unlockTime = newUnlockTime;
        emit OnLockDurationIncreased(lockId, newUnlockTime);
    }

    /**
    * @notice add tokens to an existing lock
    * @param amountToIncrement tokens amount to add
    * @param feePaymentMode fee payment mode
    */
    function increaseLockAmount(uint256 lockId, uint256 amountToIncrement, uint8 feePaymentMode)
                                                                external payable nonReentrant onlyLockOwner(lockId) {
        require(amountToIncrement > 0, "ZERO AMOUNT");
        TokenLock storage lock = tokenLocks[lockId];

        (uint256 ethFee, uint256 tokenFee, uint256 lpTokenFee) =
          feesCalculator.calculateIncreaseAmountFees(lock.lpToken, amountToIncrement, lock.unlockTime, feePaymentMode);
        require(lpTokenFee <= amountToIncrement.div(100), "LP FEE EXCEEDS 1%"); //safeguard for lp token fee
        transferFees(lock.lpToken, ethFee, tokenFee, lpTokenFee);
        if(msg.value > ethFee) { // transfer excess back
            transferBnb(msg.sender, msg.value.sub(ethFee));
        }

        uint256 actualIncrementAmount = amountToIncrement.sub(lpTokenFee);
        lock.tokenAmount = lock.tokenAmount.add(actualIncrementAmount);
        IERC20(lock.lpToken).safeTransferFrom(msg.sender, address(this), actualIncrementAmount);
        emit OnLockAmountIncreased(lockId, amountToIncrement);
    }

    /**
    * @notice withdraw all tokens from lock. Current time must be greater than unlock time
    * @param lockId lock id to withdraw
    */
    function withdraw(uint256 lockId) external {
        TokenLock storage lock = tokenLocks[lockId];
        withdrawPartially(lockId, lock.tokenAmount);
    }

    /**
    * @notice withdraw specified amount of tokens from lock. Current time must be greater than unlock time
    * @param lockId lock id to withdraw tokens from
    * @param amount amount of tokens to withdraw
    */
    function withdrawPartially(uint256 lockId, uint256 amount) public nonReentrant onlyLockOwner(lockId) {
        TokenLock storage lock = tokenLocks[lockId];
        require(lock.tokenAmount >= amount, "AMOUNT EXCEEDS LOCKED");
        require(block.timestamp >= lock.unlockTime, "NOT YET UNLOCKED");
        IERC20(lock.lpToken).safeTransfer(lock.owner, amount);

        lock.tokenAmount = lock.tokenAmount.sub(amount);
        if(lock.tokenAmount == 0) {
            //clean up storage to save gas
            userLocks[lock.owner].remove(lockId);
            delete tokenLocks[lockId];
            emit OnTokenUnlock(lockId);
        }
        emit OnLockWithdrawal(lockId, amount);
    }

    /**
    * @notice transfer lock ownership to another account
    * @param lockId lock id to transfer
    * @param newOwner account to transfer lock
    */
    function transferLock(uint256 lockId, address newOwner) external onlyLockOwner(lockId) {
        require(newOwner != address(0), "ZERO NEW OWNER");
        TokenLock storage lock = tokenLocks[lockId];
        userLocks[lock.owner].remove(lockId);
        userLocks[newOwner].add(lockId);
        lock.owner = newOwner;
        emit OnLockOwnershipTransferred(lockId, newOwner);
    }

    /**
    * @notice sets new contract to calculate fees
    * @param newFeesCalculator address of new fees calculator contract
    */
    function setFeesCalculator(address newFeesCalculator) external onlyOwner {
        require(newFeesCalculator != address(0), "ZERO ADDRESS");
        feesCalculator = IFeesCalculator(newFeesCalculator);
    }

    function transferFees(address lpToken, uint256 ethFee, uint256 tokenFee, uint256 lpTokenFee) private {
        if(ethFee > 0) {
            require(msg.value >= ethFee, "ETH FEES NOT MET");
            transferBnb(feeReceiver, ethFee);
        }
        if(tokenFee > 0) {
            require(feeToken.allowance(msg.sender, address(this)) >= tokenFee, "TOKEN FEE NOT MET");
            feeToken.safeTransferFrom(msg.sender, feeReceiver, tokenFee);
        }
        if(lpTokenFee > 0) {
            require(IERC20(lpToken).allowance(msg.sender, address(this)) >= lpTokenFee, "LP TOKEN FEE NOT MET");
            IERC20(lpToken).safeTransferFrom(msg.sender, feeReceiver, lpTokenFee);
        }
    }

    /**
    * @notice get user's locks number
    * @param user user's address
    */
    function userLocksLength(address user) external view returns (uint256) {
        return userLocks[user].length();
    }

    /**
    * @notice get user lock id at specified index
    * @param user user's address
    * @param index index of lock id
    */
    function userLockAt(address user, uint256 index) external view returns (uint256) {
        return userLocks[user].at(index);
    }

    function transferBnb(address recipient, uint256 amount) private {
        (bool res,  ) = recipient.call{value: amount}("");
        require(res, "BNB TRANSFER FAILED");
    }

    function setFeeReceiver(address payable newFeeReceiver) external onlyOwner {
        require(newFeeReceiver != address(0), "ZERO ADDRESS");
        feeReceiver = newFeeReceiver;
    }

}
