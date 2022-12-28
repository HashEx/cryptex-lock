const hre = require("hardhat");
const {parseEther} = hre.ethers.utils;

const network = 'bscTestnet';

async function main() {
    const [owner] = await ethers.getSigners()
    console.log("owner address", owner.address)

    const initialBalance = parseEther('10000');

    const PancakeFactory = await ethers.getContractFactory("PancakeFactory");
    const factory = await PancakeFactory.deploy(owner.address);
    console.log(`Factory deployed to: ${factory.address}`);
    console.log(`npx hardhat verify ${factory.address} ${owner.address} --network ${network}`);

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");

    const tokenA = await ERC20Mock.deploy("tokenA", "A", owner.address, initialBalance);
    console.log("Token A deployed to:", tokenA.address);
    console.log(`npx hardhat verify ${tokenA.address} A ${owner.address} ${initialBalance.toString()} --network ${network}`);
    const tokenB = await ERC20Mock.deploy("tokenB", "B", owner.address, initialBalance);
    console.log("Token B deployed to:", tokenB.address);
    console.log(`npx hardhat verify ${tokenB.address} B ${owner.address} ${initialBalance.toString()} --network ${network}`);

    const tx = await factory.createPair(tokenA.address, tokenB.address);

    const txData = await tx.wait()
    const lpTokenAddress = txData.events[0].args.pair
    console.log(`LP token deployed to: ${lpTokenAddress}`);
    console.log(`npx hardhat verify ${lpTokenAddress} --network ${network}`);

    const PancakePair = await ethers.getContractFactory("PancakePair")
    lpToken = await PancakePair.attach(lpTokenAddress)

    await tokenA.transfer(lpToken.address, initialBalance.div(2))
    await tokenB.transfer(lpToken.address, initialBalance.div(2))
    console.log('minting lp token')
    await lpToken.mint(owner.address, { gasLimit: 500000 })


    console.log('deploying calculator')
    const FeesCalculator = await ethers.getContractFactory("FeesCalculator");
    const feesCalculator = await FeesCalculator.deploy()
    console.log(`npx hardhat verify ${feesCalculator.address} --network ${network}`);

    const factoryAddress = factory.address;
    const feeTokenAddress = tokenA.address;
    const feesCalculatorAddress = feesCalculator.address;

    console.log('deploying locker')
    const Locker = await ethers.getContractFactory("CryptExLpTokenLocker");
    const locker = await Locker.deploy(factoryAddress, feesCalculatorAddress, owner.address, feeTokenAddress);
    console.log(`locker deployed to: ${locker.address}`)
    console.log(`npx hardhat verify ${locker.address} ${factoryAddress} ${feesCalculatorAddress} ${owner.address} ${feeTokenAddress} --network ${network}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });