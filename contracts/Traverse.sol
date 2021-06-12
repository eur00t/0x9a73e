// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./SharedDefinitions.sol";

library Traverse {
    uint256 internal constant MAX_TRAVERSE_STACK_SIZE = 256;
    uint256 internal constant MAX_TRAVERSE_RESULT_SIZE = 256;

    function traverseDependenciesP(
        mapping(bytes32 => SharedDefinitions.Module) storage modules,
        mapping(bytes32 => uint256) storage moduleNameToTokenId,
        SharedDefinitions.Module memory entryModule,
        uint256 leftResultPadding,
        function(SharedDefinitions.Module memory) view returns (bool) p
    )
        internal
        view
        returns (SharedDefinitions.Module[] memory result, uint256 size)
    {
        SharedDefinitions.Module[MAX_TRAVERSE_STACK_SIZE] memory stack;
        stack[0] = entryModule;
        uint256 iStack = 1;

        result = new SharedDefinitions.Module[](MAX_TRAVERSE_RESULT_SIZE);
        SharedDefinitions.Module[] memory visited =
            new SharedDefinitions.Module[](MAX_TRAVERSE_RESULT_SIZE);
        uint256 iRes = leftResultPadding;
        uint256 iVisited = 0;

        while (iStack > 0) {
            if (iVisited >= MAX_TRAVERSE_RESULT_SIZE) {
                revert("deps graph too large");
            }

            iStack--;
            SharedDefinitions.Module memory m = stack[iStack];

            for (uint256 i = 0; i < iVisited; i++) {
                if (
                    moduleNameToTokenId[visited[i].name] ==
                    moduleNameToTokenId[m.name]
                ) {
                    revert("cyclic dep detected");
                }
            }

            visited[iVisited] = m;
            iVisited++;

            if (p(m)) {
                result[iRes] = m;

                iRes++;
            }

            for (uint256 i = 0; i < m.dependencies.length; i++) {
                if (iStack >= MAX_TRAVERSE_STACK_SIZE) {
                    revert("deps graph too large");
                }
                stack[iStack] = modules[m.dependencies[i]];
                iStack++;
            }
        }

        return (result, iRes);
    }

    function predicateAll(SharedDefinitions.Module memory m)
        internal
        pure
        returns (bool)
    {
        return true;
    }

    function traverseDependencies(
        mapping(bytes32 => SharedDefinitions.Module) storage modules,
        mapping(bytes32 => uint256) storage moduleNameToTokenId,
        SharedDefinitions.Module memory entryModule,
        uint256 leftResultPadding
    ) internal view returns (SharedDefinitions.Module[] memory, uint256) {
        return
            traverseDependenciesP(
                modules,
                moduleNameToTokenId,
                entryModule,
                leftResultPadding,
                predicateAll
            );
    }
}
