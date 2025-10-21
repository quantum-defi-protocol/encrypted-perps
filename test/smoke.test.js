import { expect } from "chai";
import { ethers } from "hardhat";

describe("ConfidentialPerpDEX - smoke", function () {
  it("deploys and has correct initial state", async function () {
    const [deployer, other] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ConfidentialPerpDEX");
    const contract = await Factory.deploy();
    await contract.deployed();

    // admin should be deployer
    const admin = await contract.admin();
    expect(admin).to.equal(deployer.address);

    // order book should be empty
    const size = await contract.getOrderBookSize();
    expect(size).to.equal(0);

    // getUserPositions for deployer should be empty array
    const positions = await contract.getUserPositions(deployer.address);
    expect(positions.length).to.equal(0);

    // getOraclePrice should return an euint64-like value (we check it's non-zero)
    const price = await contract.getOraclePrice();
    expect(price.toString()).to.not.equal("0");
  });
});
