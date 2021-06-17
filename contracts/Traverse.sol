// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./SharedDefinitions.sol";

library Traverse {
    uint256 internal constant MAX_TRAVERSE_STACK_SIZE = 256;
    uint256 internal constant MAX_TRAVERSE_RESULT_SIZE = 256;

    function isIn(
        uint256[] memory arr,
        uint256 tokenId,
        uint256 size
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < size; i++) {
            if (arr[i] == tokenId) {
                return true;
            }
        }

        return false;
    }

    function remove(
        uint256[] memory arr,
        uint256 tokenId,
        uint256 size
    ) internal pure returns (bool) {
        uint256 i;
        for (i = 0; i < size; i++) {
            if (arr[i] == tokenId) {
                break;
            }
        }

        if (i < size) {
            arr[i] = arr[size - 1];
            return true;
        } else {
            return false;
        }
    }

    struct Iterators {
        uint256 iPermanent;
        uint256 iTemporary;
        uint256 iResult;
    }

    function visit(
        uint256[] memory permanent,
        uint256[] memory temporary,
        SharedDefinitions.Module[] memory result,
        Iterators memory i,
        mapping(bytes32 => SharedDefinitions.Module) storage modules,
        mapping(bytes32 => uint256) storage moduleNameToTokenId,
        SharedDefinitions.Module memory m
    ) internal view returns (SharedDefinitions.Module[] memory, uint256) {
        uint256 tokenId = moduleNameToTokenId[m.name];
        if (isIn(permanent, tokenId, i.iPermanent)) {
            return (result, i.iResult);
        }

        if (isIn(temporary, tokenId, i.iTemporary)) {
            revert("cyclic dep detected");
        }

        temporary[i.iTemporary] = tokenId;
        i.iTemporary++;

        for (uint256 j = 0; j < m.dependencies.length; j++) {
            visit(
                permanent,
                temporary,
                result,
                i,
                modules,
                moduleNameToTokenId,
                modules[m.dependencies[j]]
            );
        }

        if (remove(temporary, tokenId, i.iTemporary)) {
            i.iTemporary--;
        }

        permanent[i.iPermanent] = tokenId;
        i.iPermanent++;

        result[i.iResult] = m;
        i.iResult++;

        return (result, i.iResult);
    }

    function traverseDependencies(
        mapping(bytes32 => SharedDefinitions.Module) storage modules,
        mapping(bytes32 => uint256) storage moduleNameToTokenId,
        SharedDefinitions.Module memory entryModule,
        uint256 leftResultPadding
    )
        internal
        view
        returns (SharedDefinitions.Module[] memory result, uint256 size)
    {
        uint256[] memory permanent = new uint256[](MAX_TRAVERSE_RESULT_SIZE);
        uint256[] memory temporary = new uint256[](MAX_TRAVERSE_RESULT_SIZE);
        result = new SharedDefinitions.Module[](MAX_TRAVERSE_RESULT_SIZE);
        Iterators memory i =
            Iterators({
                iTemporary: 0,
                iPermanent: 0,
                iResult: leftResultPadding
            });

        (result, size) = visit(
            permanent,
            temporary,
            result,
            i,
            modules,
            moduleNameToTokenId,
            entryModule
        );
    }
}
