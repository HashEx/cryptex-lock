// SPDX-License-Identifier: UNLICENSED

// This contract locks pancakeswap liquidity tokens. Used to give investors peace of mind a token team has locked liquidity
// and that the pancake tokens cannot be removed from pancakeswap until the specified unlock date has been reached.

pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./TransferHelper.sol";

interface IPancakePair {
    function factory() external view returns (address);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

interface IERCBurn {
    function burn(uint256 _amount) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

interface IPancakeFactory {
    function getPair(address tokenA, address tokenB) external view returns (address);
}

interface IMigrator {
    function migrate(address lpToken, uint256 amount, uint256 unlockDate, address owner) external returns (bool);
}

contract CryptExLocker is Ownable, ReentrancyGuard {
  using SafeMath for uint256;
  using EnumerableSet for EnumerableSet.AddressSet;

  IPancakeFactory public pancakeFactory;

  struct UserInfo {
    EnumerableSet.AddressSet lockedTokens;
    mapping(address => uint256[]) locksForToken;
  }

  struct TokenLock {
    uint256 lockDate;
    uint256 amount;
    uint256 initialAmount;
    uint256 unlockDate;
    uint256 lockID;
    address owner;
  }

  mapping(address => UserInfo) private users;

  EnumerableSet.AddressSet private lockedTokens;
  mapping(address => TokenLock[]) public tokenLocks;
  
  struct FeeStruct {
    uint256 ethFee;
    IERCBurn secondaryFeeToken;
    uint256 secondaryTokenFee;
    uint256 secondaryTokenDiscount;
    uint256 liquidityFee;
  }
    
  FeeStruct public fees;

  address payable devaddr;
  
  IMigrator migrator;

  event onDeposit(address indexed lpToken, address indexed user, uint256 amount, uint256 lockDate, uint256 unlockDate);
  event onWithdraw(address indexed lpToken, uint256 amount);

  constructor(IPancakeFactory _pancakeFactory) public {
    devaddr = msg.sender;
    fees.ethFee = 1e18;
    fees.secondaryTokenFee = 100e18;
    fees.secondaryTokenDiscount = 300; // 30%
    fees.liquidityFee = 10; // 1%
    pancakeFactory = _pancakeFactory;
  }
  
  function setDev(address payable _devaddr) public onlyOwner {
    devaddr = _devaddr;
  }
  
  function setSecondaryFeeToken(address _secondaryFeeToken) public onlyOwner {
    fees.secondaryFeeToken = IERCBurn(_secondaryFeeToken);
  }
  
  function setFees(uint256 _ethFee, uint256 _secondaryTokenFee, uint256 _secondaryTokenDiscount, uint256 _liquidityFee) public onlyOwner {
    fees.ethFee = _ethFee;
    fees.secondaryTokenFee = _secondaryTokenFee;
    fees.secondaryTokenDiscount = _secondaryTokenDiscount;
    fees.liquidityFee = _liquidityFee;
  }

  /**
   * @notice Creates a new lock
   * @param _lpToken the pancake token address
   * @param _amount amount of LP tokens to lock
   * @param _unlock_date the unix timestamp (in seconds) until unlock
   * @param _fee_in_eth fees can be paid in eth or in a secondary token such as UNCX with a discount on pancake tokens
   * @param _withdrawer the user who can withdraw liquidity once the lock expires.
   */
  function lockLPToken(address _lpToken, uint256 _amount, uint256 _unlock_date, bool _fee_in_eth, address payable _withdrawer) external payable nonReentrant {
    require(_unlock_date < 10000000000, 'TIMESTAMP INVALID'); // prevents errors when timestamp entered in milliseconds
    require(_amount > 0, 'INSUFFICIENT');

    // ensure this pair is a pancake pair by querying the factory
    IPancakePair lpair = IPancakePair(address(_lpToken));
    address factoryPairAddress = pancakeFactory.getPair(lpair.token0(), lpair.token1());
    require(factoryPairAddress == address(_lpToken), 'NOT pancake');

    TransferHelper.safeTransferFrom(_lpToken, address(msg.sender), address(this), _amount);

    if (_fee_in_eth) {
      uint256 ethFee = fees.ethFee;
      require(msg.value == ethFee, 'FEE NOT MET');
      uint256 devFee = ethFee;
      devaddr.transfer(devFee);
    } else {
      uint256 burnFee = fees.secondaryTokenFee;
      TransferHelper.safeTransferFrom(address(fees.secondaryFeeToken), address(msg.sender), address(this), burnFee);
      fees.secondaryFeeToken.burn(burnFee);
    }

    // percent fee
    uint256 liquidityFee = _amount.mul(fees.liquidityFee).div(1000);
    if (!_fee_in_eth) { // fee discount for large lockers using secondary token
      liquidityFee = liquidityFee.mul(1000 - fees.secondaryTokenDiscount).div(1000);
    }
    TransferHelper.safeTransfer(_lpToken, devaddr, liquidityFee);
    uint256 amountLocked = _amount.sub(liquidityFee);

    TokenLock memory token_lock;
    token_lock.lockDate = block.timestamp;
    token_lock.amount = amountLocked;
    token_lock.initialAmount = amountLocked;
    token_lock.unlockDate = _unlock_date;
    token_lock.lockID = tokenLocks[_lpToken].length;
    token_lock.owner = _withdrawer;

    // record the lock for the pancake pair
    tokenLocks[_lpToken].push(token_lock);
    lockedTokens.add(_lpToken);

    // record the lock for the user
    UserInfo storage user = users[_withdrawer];
    user.lockedTokens.add(_lpToken);
    uint256[] storage user_locks = user.locksForToken[_lpToken];
    user_locks.push(token_lock.lockID);
    
    emit onDeposit(_lpToken, msg.sender, token_lock.amount, token_lock.lockDate, token_lock.unlockDate);
  }
  
  function relock(address _lpToken, uint256 _index, uint256 _lockID, uint256 _unlock_date) external nonReentrant {
    require(_unlock_date < 10000000000, 'INVALID TIMESTAMP');
    uint256 lockID = users[msg.sender].locksForToken[_lpToken][_index];
    TokenLock storage userLock = tokenLocks[_lpToken][lockID];
    require(lockID == _lockID && userLock.owner == msg.sender, 'LOCK MISMATCH');
    require(userLock.unlockDate < _unlock_date, 'UNLOCK BEFORE');
    
    uint256 liquidityFee = userLock.amount.mul(fees.liquidityFee).div(1000);
    uint256 amountLocked = userLock.amount.sub(liquidityFee);
    
    userLock.amount = amountLocked;
    userLock.unlockDate = _unlock_date;

    TransferHelper.safeTransfer(_lpToken, devaddr, liquidityFee);
  }
  
  function withdraw(address _lpToken, uint256 _index, uint256 _lockID, uint256 _amount) external nonReentrant {
    require(_amount > 0, 'ZERO WITHDRAWAL');
    uint256 lockID = users[msg.sender].locksForToken[_lpToken][_index];
    TokenLock storage userLock = tokenLocks[_lpToken][lockID];
    require(lockID == _lockID && userLock.owner == msg.sender, 'LOCK MISMATCH'); // ensures correct lock is affected
    require(userLock.unlockDate < block.timestamp, 'NOT YET');
    userLock.amount = userLock.amount.sub(_amount);
    
    // clean user storage
    if (userLock.amount == 0) {
      uint256[] storage userLocks = users[msg.sender].locksForToken[_lpToken];
      userLocks[_index] = userLocks[userLocks.length-1];
      userLocks.pop();
      if (userLocks.length == 0) {
        users[msg.sender].lockedTokens.remove(_lpToken);
      }
    }
    
    TransferHelper.safeTransfer(_lpToken, msg.sender, _amount);
    emit onWithdraw(_lpToken, _amount);
  }

  /**
  * @notice
  */
  function incrementLock(address _lpToken, uint256 _index, uint256 _lockID, uint256 _amount) external nonReentrant {
    require(_amount > 0, 'ZERO AMOUNT');
    uint256 lockID = users[msg.sender].locksForToken[_lpToken][_index];
    TokenLock storage userLock = tokenLocks[_lpToken][lockID];
    require(lockID == _lockID && userLock.owner == msg.sender, 'LOCK MISMATCH');
    
    TransferHelper.safeTransferFrom(_lpToken, address(msg.sender), address(this), _amount);
    
    uint256 liquidityFee = _amount.mul(fees.liquidityFee).div(1000);
    TransferHelper.safeTransfer(_lpToken, devaddr, liquidityFee);
    uint256 amountLocked = _amount.sub(liquidityFee);
    
    userLock.amount = userLock.amount.add(amountLocked);
    
    emit onDeposit(_lpToken, msg.sender, amountLocked, userLock.lockDate, userLock.unlockDate);
  }
  
  function transferLockOwnership(address _lpToken, uint256 _index, uint256 _lockID, address payable _newOwner) external {
    require(msg.sender != _newOwner, 'OWNER');
    uint256 lockID = users[msg.sender].locksForToken[_lpToken][_index];
    TokenLock storage transferredLock = tokenLocks[_lpToken][lockID];
    require(lockID == _lockID && transferredLock.owner == msg.sender, 'LOCK MISMATCH'); // ensures correct lock is affected
    
    UserInfo storage user = users[_newOwner];
    user.lockedTokens.add(_lpToken);
    uint256[] storage user_locks = user.locksForToken[_lpToken];
    user_locks.push(transferredLock.lockID);
    
    uint256[] storage userLocks = users[msg.sender].locksForToken[_lpToken];
    userLocks[_index] = userLocks[userLocks.length-1];
    userLocks.pop();
    if (userLocks.length == 0) {
      users[msg.sender].lockedTokens.remove(_lpToken);
    }
    transferredLock.owner = _newOwner;
  }

  function getNumLocksForToken(address _lpToken) external view returns (uint256) {
    return tokenLocks[_lpToken].length;
  }
  
  function getNumLockedTokens() external view returns (uint256) {
    return lockedTokens.length();
  }
  
  function getLockedTokenAtIndex(uint256 _index) external view returns (address) {
    return lockedTokens.at(_index);
  }
  
  function getUserNumLockedTokens(address _user) external view returns (uint256) {
    UserInfo storage user = users[_user];
    return user.lockedTokens.length();
  }
  
  function getUserLockedTokenAtIndex(address _user, uint256 _index) external view returns (address) {
    UserInfo storage user = users[_user];
    return user.lockedTokens.at(_index);
  }
  
  function getUserNumLocksForToken(address _user, address _lpToken) external view returns (uint256) {
    UserInfo storage user = users[_user];
    return user.locksForToken[_lpToken].length;
  }
  
  function getUserLockForTokenAtIndex(address _user, address _lpToken, uint256 _index) external view
  returns (uint256, uint256, uint256, uint256, uint256, address) {
    uint256 lockID = users[_user].locksForToken[_lpToken][_index];
    TokenLock storage tokenLock = tokenLocks[_lpToken][lockID];
    return (tokenLock.lockDate, tokenLock.amount, tokenLock.initialAmount, tokenLock.unlockDate, tokenLock.lockID, tokenLock.owner);
  }
  
}