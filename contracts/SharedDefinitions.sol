// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

library SharedDefinitions {
    struct Module {
        bytes32 name;
        string metadataJSON;
        bytes32[] dependencies;
        string code;
        bool isInvocable;
    }
}
