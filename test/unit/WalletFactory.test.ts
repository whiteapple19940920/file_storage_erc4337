const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
import { Contract, Signer } from "ethers";
import { deployNew } from "../../utils/helper";
import { BigNumber } from "ethers";
import { getUserOperation } from "../../scripts/getUserOperation";

describe("Test Wallet Factory", function () {

    let deployer: Signer;
    let walletFactory: Contract;

    const walletOwner:string = "0x0000000000000000000000000000000000000003";
    let entryPoint:Contract;

    const salt = ethers.BigNumber.from("0x4");

    beforeEach(async function () {
        [ deployer ] = await ethers.getSigners();
        walletFactory = await deployNew("WalletFactory", []);
        entryPoint = await deployNew("EntryPoint", []);
    }); 

    // it("Test Deploy Wallet", async function () {
    //     const wallet: Contract = await walletFactory.deployWallet(entryPoint.address, walletOwner, salt);
    //     // console.log(wallet.address)
    //     const computedWalletAddress = await walletFactory.computeAddress(entryPoint.address, walletOwner, salt);
    //     // expect(wallet.address).to.be.eq(computedWalletAddress);
    //     // expect(await wallet.entryPoint()).to.be.eq(entryPoint);
    //     // expect(await wallet.owner()).to.be.eq(walletOwner);
    // });

});