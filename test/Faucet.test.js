const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Faucet", function () {
  let faucetToken;
  let faucet;
  let owner;
  let user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy FaucetToken
    const FaucetToken = await ethers.getContractFactory("FaucetToken");
    faucetToken = await FaucetToken.deploy(1000000);
    await faucetToken.waitForDeployment();

    // Deploy Faucet
    const Faucet = await ethers.getContractFactory("Faucet");
    faucet = await Faucet.deploy(await faucetToken.getAddress());
    await faucet.waitForDeployment();

    // Transfer ownership of token to faucet
    await faucetToken.transferOwnership(await faucet.getAddress());

    // Fund the faucet with ETH
    await owner.sendTransaction({
      to: await faucet.getAddress(),
      value: ethers.parseEther("1.0")
    });
  });

  it("Should allow users to request funds", async function () {
    // Get initial balances
    const initialEthBalance = await ethers.provider.getBalance(user.address);
    const initialTokenBalance = await faucetToken.balanceOf(user.address);

    // Request funds
    await faucet.connect(user).requestFunds();

    // Get final balances
    const finalEthBalance = await ethers.provider.getBalance(user.address);
    const finalTokenBalance = await faucetToken.balanceOf(user.address);

    // Check that ETH was received (accounting for gas costs)
    expect(finalEthBalance).to.be.gt(initialEthBalance - ethers.parseEther("0.01"));

    // Check that tokens were received
    expect(finalTokenBalance).to.equal(initialTokenBalance + BigInt(100 * 10**18));
  });

  it("Should enforce cooldown period", async function () {
    // Request funds first time
    await faucet.connect(user).requestFunds();

    // Try to request funds again immediately
    await expect(
      faucet.connect(user).requestFunds()
    ).to.be.revertedWith("Cooldown period not over");
  });
});
