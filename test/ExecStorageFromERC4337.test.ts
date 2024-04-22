const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
import { Contract, Signer } from "ethers";
import { deployNew } from "../utils/helper";
import { BigNumber } from "ethers";

describe("Test Storage Contract", function () {

    let deployer: Signer;
    let owner: Signer;
    let node: Signer;
    let entryPoint: Contract;
    let entryPointAddress;
    let paymaster: Contract;
    let walletFactory: Contract;
    let storage: Contract;
    let mockERC20: Contract;
    let beneficiary: string;
    let sender: string;
    let aggregator: string;
    let missingWalletFunds: BigNumber; 

    const ownerAddress = "0x60365098283d25A3ddbeB38c855Ea4043A6B2dF1";
    const ownerPrivateKey: string = "0x0f2dfdd3f1a66138d6bfe582f8b8539ee10933fc71e7a11f0c12252fd6de29a0";
    const salt = ethers.BigNumber.from("0x101");

    const userOp = {
        sender: "",
        nonce: 0,
        initCode: "0x",
        callData: "0x",
        callGasLimit: 2_000_000,
        verificationGasLimit: 3_000_000,
        preVerificationGas: 1_000_000,
        maxFeePerGas: 1_000_105_660,
        maxPriorityFeePerGas: 1_000_000_000,
        paymasterAndData: "0x",
        signature: "0x"
    };

    beforeEach(async function () {
        [deployer, node] = await ethers.getSigners();
        owner = await ethers.getSigner(ownerAddress);
        beneficiary = ownerAddress;
        entryPoint = await deployNew("EntryPoint", []);
        entryPointAddress = entryPoint.address;
        paymaster = await deployNew("Paymaster", [ entryPointAddress ]);
        walletFactory = await deployNew("WalletFactory", []);
        storage = await deployNew("StorageContract", []);

        sender = await walletFactory.computeAddress(entryPoint.address, beneficiary, salt);
        userOp.sender = sender;

        await deployer.sendTransaction({
            to: sender,
            value: ethers.utils.parseEther("1")
        });

        const initCode = ethers.utils.solidityPack(
            ["address", "bytes"],
            [
                walletFactory.address,
                walletFactory.interface.encodeFunctionData("deployWallet", [entryPoint.address, ownerAddress, salt])
            ]
        );
        userOp.initCode = initCode;

        const paymasterAndData = ethers.utils.solidityPack(
            ["bytes"], 
            [paymaster.address]
        );
        userOp.paymasterAndData = paymasterAndData;

        aggregator = ethers.constants.AddressZero;
        missingWalletFunds = ethers.BigNumber.from("1096029019333521");

        await deployer.sendTransaction({
            to: await deployer.getAddress(),
            value: ethers.utils.parseEther("5")
        });

        await paymaster.deposit({value: ethers.utils.parseEther("1")});
        await paymaster.addStake(ethers.BigNumber.from("0xFFFFFFFF"), {value: ethers.utils.parseEther("1")});
    }); 

    it("Test Fee Management Storage Contract", async function () {
        const initialWalletEthBalance = await ethers.provider.getBalance(sender);
        const initialPaymasterDeposit = await paymaster.getDeposit();
        expect(initialPaymasterDeposit).to.be.gt(ethers.BigNumber.from("0"));

        const expectedWalletAddress = await walletFactory.computeAddress(entryPoint.address, ownerAddress, salt);
        mockERC20 = await deployNew("MockERC20", []);
        await mockERC20.mint(expectedWalletAddress, 100);

        const smartWalletAbi = await require("../abis/SmartWallet.json");
        const deployedWallet = new ethers.Contract(expectedWalletAddress, smartWalletAbi, owner);

        const payload = storage.interface.encodeFunctionData(
            "addNode",
            [await node.getAddress()]
        );
        const callData = deployedWallet.interface.encodeFunctionData(
            "executeFromEntryPoint", 
            [
                storage.address, 
                0, 
                payload
            ]
        );

        userOp.callData = callData;

        const userOpHash = await entryPoint.getUserOpHash(userOp);
        const ownerWallet = new ethers.Wallet(ownerPrivateKey, ethers.provider);
        const signature = await ownerWallet.signMessage(ethers.utils.arrayify(userOpHash));
        userOp.signature = signature;
        await entryPoint.handleOps([userOp], beneficiary);

        // Verify Paymaster deposit on EntryPoint was used to pay for gas
        const paymasterDepositLoss = initialPaymasterDeposit.sub(await paymaster.getDeposit());
        expect(paymasterDepositLoss).to.be.gt(ethers.BigNumber.from("0"));

        // Verify smart contract wallet did not use it's gas deposit
        const walletEthLoss = initialWalletEthBalance.sub(await ethers.provider.getBalance(expectedWalletAddress));
        expect(walletEthLoss).to.be.eq(ethers.BigNumber.from("0"));
    });
});