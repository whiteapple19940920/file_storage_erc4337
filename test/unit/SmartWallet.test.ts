const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
import { Contract, Signer } from "ethers";
import { deployNew } from "../../utils/helper";
import { BigNumber } from "ethers";
import { getUserOperation } from "../../scripts/getUserOperation";

describe("Test SmartWallet Functions", function () {

    let deployer: Signer;
    let owner: Signer;
    let entryPoint: Contract;
    let mockERC20: Contract;
    let mockSetter: Contract;
    let smartWallet: Contract;
    let chainId: number;

    const ownerAddress = "0x60365098283d25A3ddbeB38c855Ea4043A6B2dF1";
    const ownerPrivateKey: string = "0x0f2dfdd3f1a66138d6bfe582f8b8539ee10933fc71e7a11f0c12252fd6de29a0";

    beforeEach(async function () {
        [ deployer ] = await ethers.getSigners();
        owner = await ethers.getSigner(ownerAddress);

        const provider = ethers.provider;
        chainId = await provider.getNetwork().then((network: any) => network.chainId);

        entryPoint = await deployNew("EntryPoint", []);
        mockSetter = await deployNew("MockSetter", []);
        smartWallet = await deployNew("SmartWallet", [ entryPoint.address, ownerAddress ]);

        await deployer.sendTransaction({
            to: await owner.getAddress(),
            value: ethers.utils.parseEther("5")
        });

        expect(smartWallet.address).to.not.eq(ethers.constants.AddressZero);
    }); 

    it("Test Setup State", async function () {
        expect(await smartWallet.entryPoint()).to.be.eq(entryPoint.address);
        expect(await smartWallet.owner()).to.be.eq(ownerAddress);
    });

    it("Test UpdateEntryPoint", async function () {
        const newEntryPointAddress = "0x0000000000000000000000000000000000000002";
        const ownerWallet = new ethers.Wallet(ownerPrivateKey, ethers.provider);
        await smartWallet.connect(ownerWallet).setEntryPoint(newEntryPointAddress);
        expect(await smartWallet.entryPoint()).to.be.eq(newEntryPointAddress);
    });

    it("Test UpdateEntryPoint Auth", async function () {
        const newEntryPointAddress = "0x0000000000000000000000000000000000000002";
        // Unauthorized account sign to smart wallet
        await expect(smartWallet.connect(deployer).setEntryPoint(newEntryPointAddress)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Test ValidateUserOp", async function () {
        expect(await smartWallet.nonce()).to.be.eq(0);
        const userOpInfo = await getUserOperation(
            smartWallet.address,
            await smartWallet.nonce(),
            "0x",
            ownerPrivateKey
        );
        const userOp = userOpInfo.userOp;
        const userOpHash = userOpInfo.userOpHash;
        const missingWalletFunds = 0;
        const aggregator = "0x0000000000000000000000000000000000000002";
        const ownerWallet = new ethers.Wallet(ownerPrivateKey, ethers.provider);
        await smartWallet.connect(ownerWallet).setEntryPoint(await deployer.getAddress());

        const deadlineObj = await smartWallet.connect(deployer).validateUserOp(userOp, userOpHash, aggregator, missingWalletFunds);
        const deadline = deadlineObj.value;

        expect(deadline).to.be.eq(ethers.BigNumber.from(0));
    });

    it("Test Execute From EntryPoint", async function () {
        expect(await mockSetter.value()).to.be.eq(0);
        const payload = mockSetter.interface.encodeFunctionData("setValue", [1]);
        const ownerWallet = new ethers.Wallet(ownerPrivateKey, ethers.provider);
        await smartWallet.connect(ownerWallet).setEntryPoint(await deployer.getAddress());
        await smartWallet.connect(deployer).executeFromEntryPoint(mockSetter.address, 0, payload);
        expect(await mockSetter.value()).to.be.eq(1);
    });
});