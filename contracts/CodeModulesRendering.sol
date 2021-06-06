// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "./Base64.sol";
import "./definitions.sol";

library CodeModulesRendering {
    using Base64 for string;
    using Strings for uint256;

    function strConcat(string memory _a, string memory _b)
        internal
        pure
        returns (string memory result)
    {
        result = string(abi.encodePacked(bytes(_a), bytes(_b)));
    }

    function strConcat3(
        string memory s1,
        string memory s2,
        string memory s3
    ) internal pure returns (string memory result) {
        result = string(abi.encodePacked(bytes(s1), bytes(s2), bytes(s3)));
    }

    function strConcat4(
        string memory s1,
        string memory s2,
        string memory s3,
        string memory s4
    ) internal pure returns (string memory result) {
        result = string(
            abi.encodePacked(bytes(s1), bytes(s2), bytes(s3), bytes(s4))
        );
    }

    function strConcatArr(string[] memory arr)
        internal
        pure
        returns (string memory result)
    {
        for (uint256 i = 0; i < arr.length; i++) {
            result = strConcat(result, arr[i]);
        }
    }

    function join(string[] memory arr, string memory sep)
        internal
        pure
        returns (string memory result)
    {
        if (arr.length == 0) {
            return "";
        }

        for (uint256 i = 0; i < arr.length - 1; i++) {
            result = strConcat3(result, arr[i], sep);
        }

        result = strConcat(result, arr[arr.length - 1]);
    }

    function stringToJSON(string memory str)
        internal
        pure
        returns (string memory result)
    {
        return strConcat3('"', str, '"');
    }

    function dictToJSON(string[] memory keys, string[] memory values)
        internal
        pure
        returns (string memory result)
    {
        assert(keys.length == values.length);

        string[] memory arr = new string[](keys.length);

        for (uint256 i = 0; i < keys.length; i++) {
            arr[i] = strConcat3(stringToJSON(keys[i]), ": ", values[i]);
        }

        return strConcat3("{", join(arr, ", "), "}");
    }

    function arrToJSON(string[] memory arr)
        internal
        pure
        returns (string memory result)
    {
        return strConcat3("[", join(arr, ", "), "]");
    }

    function strArrToJSON(string[] memory arr)
        internal
        pure
        returns (string memory result)
    {
        if (arr.length == 0) {
            return "[]";
        }

        return strConcat3('["', join(arr, '", "'), '"]');
    }

    function moduleToJSON(Module memory m)
        internal
        pure
        returns (string memory result)
    {
        string[] memory keys = new string[](3);
        keys[0] = "name";
        keys[1] = "code";
        keys[2] = "dependencies";

        string[] memory values = new string[](3);
        values[0] = stringToJSON(m.name);
        values[1] = stringToJSON(m.code);
        values[2] = strArrToJSON(m.dependencies);

        return dictToJSON(keys, values);
    }

    function traverseDependencies(
        mapping(string => Module) storage modules,
        Module memory entryModule,
        uint8 leftResultPadding
    ) internal view returns (Module[128] memory result, uint8 size) {
        Module[128] memory stack;
        stack[0] = entryModule;
        uint8 iStack = 1;

        Module[128] memory res;
        uint8 iRes = leftResultPadding;

        while (iStack > 0) {
            iStack--;
            Module memory m = stack[iStack];
            res[iRes] = m;
            iRes++;

            for (uint256 i = 0; i < m.dependencies.length; i++) {
                stack[iStack] = modules[m.dependencies[i]];
                iStack++;
            }
        }

        return (res, iRes);
    }

    function getJSONForModules(Module[128] memory traversedModules, uint8 size)
        internal
        pure
        returns (string memory result)
    {
        string[] memory arr = new string[](size);
        for (uint256 i = 0; i < size; i++) {
            arr[i] = moduleToJSON(traversedModules[i]);
        }

        return arrToJSON(arr);
    }

    function getModuleValueJSON(
        mapping(string => Module) storage modules,
        Module memory m
    ) external view returns (string memory result) {
        Module[128] memory res;
        uint8 size;

        (res, size) = traverseDependencies(modules, m, 0);

        return getJSONForModules(res, size);
    }

    function getModuleSeedValueJSON(
        mapping(string => Module) storage modules,
        Module memory m,
        uint256 seed
    ) external view returns (string memory result) {
        Module[128] memory res;
        uint8 size;

        string[] memory dependencies = new string[](1);
        dependencies[0] = m.name;

        (res, size) = traverseDependencies(modules, m, 1);

        res[0] = Module({
            name: "module-invocation",
            metadataJSON: "",
            dependencies: dependencies,
            code: strConcat3('(f) => f("', seed.toHexString(), '")').encode(),
            isInvocable: false
        });

        return getJSONForModules(res, size);
    }
}
