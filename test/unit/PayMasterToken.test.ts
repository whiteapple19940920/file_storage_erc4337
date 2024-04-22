const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
import { Contract, Signer } from "ethers";
import { deployNew } from "../../utils/helper";
import { BigNumber } from "ethers";
import { getUserOperation } from "../../scripts/getUserOperation";

describe("Test PayMasterToken", function () {

    let deployer: Signer;
    let owner: Signer;
    let mockERC20: Contract;
    let paymasterToken: Contract;

    const ownerAddress:string = "0x60365098283d25A3ddbeB38c855Ea4043A6B2dF1";
    const entryPoint:string = "0x0000000000000000000000000000000000000001";
    const oracle:string = "0x0000000000000000000000000000000000000002";

    beforeEach(async function () {
        [ deployer ] = await ethers.getSigners();
        owner = await ethers.getSigner(ownerAddress);

        mockERC20 = await deployNew("MockERC20", []);
        paymasterToken = await deployNew("PayMasterToken", [entryPoint]);

        await deployer.sendTransaction({
            to: await owner.getAddress(),
            value: ethers.utils.parseEther("5")
        });
    }); 

    it("Test Add Token", async function () {
        await paymasterToken.addToken(mockERC20.address, oracle);
        expect(await paymasterToken.tokenToOracle(mockERC20.address)).to.be.eq(oracle);
        expect(await paymasterToken.getTokenOracle(mockERC20.address)).to.be.eq(oracle);
    });

    it("Test Remove Token", async function () {
        await paymasterToken.addToken(mockERC20.address, oracle);
        await paymasterToken.removeToken(mockERC20.address);
        expect(await paymasterToken.getTokenOracle(mockERC20.address)).to.be.eq(ethers.constants.AddressZero);
    });
});