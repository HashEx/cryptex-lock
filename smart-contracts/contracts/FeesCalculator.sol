// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;

import "./IFeesCalculator.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FeesCalculator is Ownable, IFeesCalculator {
    using SafeMath for uint256;

    uint256 public ethMin = 1 ether;
    uint256 public tokenMin = 4.5 ether;      // 0.75*ethMin for 2021/02/28
    uint256 public ethMax = 23 ether;       // ~$5000 for 2021/02/28
    uint256 public tokenMax = 103.5 ether;    // 0.75*ethMax for 2021/02/28
    uint256 public liquidityPercent = 30;   // 0.3%

    uint8 public PAYMENT_MODE_BNB_LP_TOKEN = 0;
    uint8 public PAYMENT_MODE_CRX_LP_TOKEN = 1;
    uint8 public PAYMENT_MODE_BNB_MAX = 2;
    uint8 public PAYMENT_MODE_CRX_MAX = 3;

    event OnFeeChanged(
        uint256 ethMin,
        uint256 tokenMin,
        uint256 ethMax,
        uint256 tokenMax,
        uint256 liquidityPercent
    );

    /**
    * @notice Calculates lock fees based on input params
    * @param amount amount of tokens to lock
    * @param paymentMode    0 - pay fees in minBNB + LP token,
    *                       1 - pay fees in minCRX + LP token,
    *                       2 - pay fees fully in maxBNB,
    *                       3 - pay fees fully in maxCRX
    */
    function calculateFees(address /* lpToken */, uint256 amount, uint256 /* unlockTime */,
        uint8 paymentMode) external override view returns(uint256 ethFee, uint256 tokenFee, uint256 lpTokenFee)  {
        require (paymentMode <= 3, "INVALID PAYMENT METHOD");
        if (paymentMode == PAYMENT_MODE_BNB_LP_TOKEN) {
            return (ethMin, 0, liquidityPercent.mul(amount).div(1e4));
        }
        if (paymentMode == PAYMENT_MODE_CRX_LP_TOKEN) {
            return (0, tokenMin, liquidityPercent.mul(amount).div(1e4));
        }
        if (paymentMode == PAYMENT_MODE_BNB_MAX) {
            return (ethMax, 0, 0);
        }
        return (0, tokenMax, 0);
    }

    /**
    * @notice Calculates increase lock amount fees based on input params
    * @param amount amount of tokens to lock
    * @param paymentMode    0 - pay fees in minBNB + LP token,
    *                       1 - pay fees in minCRX + LP token,
    *                       2 - pay fees fully in maxBNB,
    *                       3 - pay fees fully in maxCRX
    */
    function calculateIncreaseAmountFees(address /* lpToken */, uint256 amount, uint256 /* unlockTime */,
        uint8 paymentMode) external override view returns(uint256 ethFee, uint256 tokenFee, uint256 lpTokenFee)  {
        require (paymentMode <= 3, "INVALID PAYMENT METHOD");
        if (paymentMode == PAYMENT_MODE_BNB_MAX) {
            return (ethMax, 0, 0);
        }
        if (paymentMode == PAYMENT_MODE_CRX_MAX) {
            return (0, tokenMax, 0);
        }
        return (0, 0, liquidityPercent.mul(amount).div(1e4));
    }

    function getFees() external view returns(uint256, uint256, uint256, uint256, uint256)  {
        return (ethMin, tokenMin, ethMax, tokenMax, liquidityPercent);
    }

    function setEthMin(uint256 _ethMin) external onlyOwner {
        ethMin = _ethMin;

        emit OnFeeChanged(ethMin, tokenMin, ethMax, tokenMax, liquidityPercent);
    }

    function setTokenMin(uint256 _tokenMin) external onlyOwner {
        tokenMin = _tokenMin;

        emit OnFeeChanged(ethMin, tokenMin, ethMax, tokenMax, liquidityPercent);
    }

    function setEthMax(uint256 _ethMax) external onlyOwner {
        ethMax = _ethMax;

        emit OnFeeChanged(ethMin, tokenMin, ethMax, tokenMax, liquidityPercent);
    }

    function setTokenMax(uint256 _tokenMax) external onlyOwner {
        tokenMax = _tokenMax;

        emit OnFeeChanged(ethMin, tokenMin, ethMax, tokenMax, liquidityPercent);
    }

    function setLiquidityPercent(uint256 _liquidityPercent) external onlyOwner {
        liquidityPercent = _liquidityPercent;

        emit OnFeeChanged(ethMin, tokenMin, ethMax, tokenMax, liquidityPercent);
    }

}