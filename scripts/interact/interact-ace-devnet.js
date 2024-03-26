const { parseEther } = require('ethers/lib/utils');
const { ethers } = require("hardhat");

async function main() {
    console.log("Getting the deposit contract...");
    const contractAddress = "0xC53468C61B7CAab535ddBc5bC903f1913Ef04dd2";
    const catalist = await ethers.getContractAt("Catalist", contractAddress);

    const [owner, ad1, ad2] = await ethers.getSigners();

    console.log();
    console.log('Querying token name...');
    const name = await catalist.name();
    console.log('Token name:', name);

    console.log();
    console.log('Querying token symbol...');
    const symbol = await catalist.symbol();
    console.log('Token symbol:', symbol);

    console.log();
    console.log('Querying token decimals...');
    const decimals = await catalist.decimals();
    console.log('Token decimals:', decimals.toString());

    console.log();
    console.log('Querying token total supply...');
    let totalSupply = await catalist.totalSupply();
    console.log('Token total supply:', totalSupply.toString());

    console.log();
    console.log('Querying get buffered ace...');
    let bufferedAce = await catalist.getBufferedAce();
    console.log('Buffered ACE:', bufferedAce.toString());

    console.log();
    console.log('Querying get total staked ace...');
    let totalStakedAce = await catalist.getTotalPooledAce();
    console.log('Total staked ACE:', totalStakedAce.toString());

    // console.log();
    // console.log('Querying initialize...');
    // let initialized = await catalist.initialize("0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575", "0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8", parseEther("2"));
    // console.log('Initialized:', initialized);

    // console.log();
    // const beforeBalance = await catalist.balanceOf(
    //     // "0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058"
    //     ad1.address
    // );
    // console.log("Balance of 0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058: ", beforeBalance.toString());

    console.log();
    console.log("Staking 1ACE...");
    await catalist
        .connect("0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058")
        .submit(owner.address, parseEther("1"));

    // const afterBalance = await catalist.balanceOf(
    //     "0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058"
    // );
    // console.log(
    //     "Balance of 0x63cac65c5eb17E6Dd47D9313e23169f79d1Ab058: ",
    //     afterBalance.toString()
    // );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
