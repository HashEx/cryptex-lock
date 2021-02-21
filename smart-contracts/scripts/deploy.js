async function main() {
    const [owner] = await ethers.getSigners()
    console.log("owner address", owner.address)

    const initialBalance = '100000000000000000000000';

    const PancakeFactory = await ethers.getContractFactory("PancakeFactory");
    const factory = await PancakeFactory.deploy(owner.address, { nonce: 14 });
    console.log(`Factory deployed to: ${factory.address}`);

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");

    const tokenA = await ERC20Mock.deploy("tokenA", "A", owner.address, initialBalance);
    console.log("Token A deployed to:", tokenA.address);
    const tokenB = await ERC20Mock.deploy("tokenB", "B", owner.address, initialBalance);
    console.log("Token B deployed to:", tokenA.address);

    const tx = await factory.createPair(tokenA.address, tokenB.address);

    const txData = await tx.wait()
    const lpTokenAddress = txData.events[0].args.pair
    console.log(`LP token deployed to: ${lpTokenAddress}`);

    const PancakePair = await ethers.getContractFactory("PancakePair")
    lpToken = await PancakePair.attach(lpTokenAddress)

    await tokenA.transfer(lpToken.address, initialBalance)
    await tokenB.transfer(lpToken.address, initialBalance)
    await lpToken.mint(owner.address)

    const PancakeSwapLocker = await ethers.getContractFactory("PancakeswapLocker");
    const pancakeSwapLocker = await PancakeSwapLocker.deploy(factory.address);
    console.log(`Locker deployed to: ${pancakeSwapLocker.address}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });