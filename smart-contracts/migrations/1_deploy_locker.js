const MyContract = artifacts.require("LpLockerBSC");

module.exports = function(deployer) {
	deployer.deploy(MyContract, "0x6725F303b657a9451d8BA641348b6761A6CC7a17");
};