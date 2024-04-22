// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";

contract StorageContract is Ownable {
    struct File {
        string ipfsHash;
        address owner;
    }

    struct NodeInfo {
        address nodeAddress;
        uint256 index; // Index in the activeNodes array
        bool isActive;
    }

    mapping(address => File[]) public storageNodes; // Maps node addresses to files
    address[] public activeNodes; // Array of active node addresses for easier management
    mapping(address => NodeInfo) public nodeInfoMap; // Maps node addresses to their information

    constructor() Ownable() {
    }

    // Function to add a new node
    function addNode(address nodeAddress) public onlyOwner {
        require(!nodeInfoMap[nodeAddress].isActive, "Node already exists");
        activeNodes.push(nodeAddress);
        uint256 index = activeNodes.length - 1;
        nodeInfoMap[nodeAddress] = NodeInfo(nodeAddress, index, true);
    }

    // Function to delete a node
    function deleteNode(address nodeAddress) public onlyOwner {
        require(nodeInfoMap[nodeAddress].isActive, "Node does not exist");
        uint256 indexToDelete = nodeInfoMap[nodeAddress].index;
        address lastNodeAddress = activeNodes[activeNodes.length - 1];

        // Move the last element into the place to delete
        activeNodes[indexToDelete] = lastNodeAddress;
        nodeInfoMap[lastNodeAddress].index = indexToDelete;
        activeNodes.pop();

        // Remove node info
        delete nodeInfoMap[nodeAddress];
    }

    function addFile(string memory ipfsHash, address node) public {
        require(nodeInfoMap[node].isActive, "Node does not exist");
        storageNodes[node].push(File(ipfsHash, msg.sender));
    }

    function verifyProof(address node, string memory ipfsHash) public view returns (bool) {
        require(nodeInfoMap[node].isActive, "Node does not exist");
        File[] memory files = storageNodes[node];
        for (uint i = 0; i < files.length; i++) {
            if (keccak256(abi.encodePacked(files[i].ipfsHash)) == keccak256(abi.encodePacked(ipfsHash))) {
                return true;
            }
        }
        return false;
    }
}