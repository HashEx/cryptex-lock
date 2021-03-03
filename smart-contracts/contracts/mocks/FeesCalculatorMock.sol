// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;

import "../IFeesCalculator.sol";

contract FeesCalculatorMock is IFeesCalculator {

    uint256 public ethFee = 1 ether;
    uint256 public tokenFee = 0.75e18;
    uint256 public lpTokenFee = 1;
    uint256 public ethMaxFee = 5 ether;
    uint256 public tokenMaxFee = 4 ether;

    function calculateFees(address /* lpToken */, uint256 /* amount */, uint256 /* unlockTime */,
        uint8 paymentMode) public override view returns(uint256 ethFee, uint256, uint256)  {
        uint ethFee = 1 ether;
        if(paymentMode == 0) {
            return (ethFee, 0, lpTokenFee);
        } else if (paymentMode == 1) {
            return (0, tokenFee, lpTokenFee);
        } else if (paymentMode == 2) {
            return (ethMaxFee, 0, 0);
        } else if (paymentMode == 3) {
            return (0, tokenMaxFee, 0);
        } else {
            require(false, "unknown mode");
            return (0, 0, 0);
        }
    }

    function calculateIncreaseAmountFees(address /* lpToken */ , uint256 /* amount */,  uint256 /* unlockTime */,
        uint8 /* paymentMode */) public override view returns(uint256 ethFee, uint256 tokenFee, uint256 lpTokenFee)  {
        return (0, 0, 1);
    }

}