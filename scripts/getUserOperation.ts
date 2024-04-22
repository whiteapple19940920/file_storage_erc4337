// Assuming you have Hardhat environment setup with ethers
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
// const { defaultAbiCoder } = ethers.utils;
// const { keccak256, arrayify } = ethers.utils;

interface UserOperation {
    sender: string;
    nonce: number;
    initCode: string;
    callData: string;
    callGasLimit: BigNumber;
    verificationGasLimit: BigNumber;
    preVerificationGas: BigNumber;
    maxFeePerGas: BigNumber;
    maxPriorityFeePerGas: BigNumber;
    paymasterAndData: string;
}

const entryPoint = "0x0000000000000000000000000000000000000001";
const chainId = 1;

export const getUserOperation = async (senderAddress: string, nonce: number, callData: string, ownerPrivateKey: string) => {
    const sender = await ethers.getSigner(senderAddress);
    const userOp = {
        sender: sender.address,
        nonce: nonce,
        initCode: "0x",
        callData: callData,
        callGasLimit: 22017,
        verificationGasLimit: 958666,
        preVerificationGas: 115256,
        maxFeePerGas: 1000105660,
        maxPriorityFeePerGas: 1000000000,
        paymasterAndData: "0x",
        signature: "0x"
    };

    const userOpHash = await getUserOpHash(userOp);
    const signature = await createSignature(userOpHash, ownerPrivateKey);
    userOp.signature = signature;

    return { userOp, userOpHash };
}

export const getUserOpHash = async (userOp: any) => {
    // Simplify hashing logic as per your contract's requirements
    const innerHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
        ['address', 'uint256', 'bytes', 'bytes', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes'],
        [
            userOp.sender,
            userOp.nonce,
            userOp.initCode,
            userOp.callData,
            userOp.callGasLimit,
            userOp.verificationGasLimit,
            userOp.preVerificationGas,
            userOp.maxFeePerGas,
            userOp.maxPriorityFeePerGas,
            userOp.paymasterAndData
        ]
    ));
    return ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
        ['bytes32', 'address', 'uint256'],
        [innerHash, entryPoint, chainId]
    ));
}

const createSignature = async (userOpHash: string, privateKey: string) => {
    const wallet = new ethers.Wallet(privateKey);
    return await wallet.signMessage(ethers.utils.arrayify(userOpHash));
}