// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

struct Module {
    string name;
    string metadataJSON;
    string[] dependencies;
    string code;
    bool isInvocable;
}
