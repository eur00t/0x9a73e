// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "./Base64.sol";
import "./Traverse.sol";
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

    function getJSONForModules(Module[] memory traversedModules, uint256 size)
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

    function getAllDependencies(
        mapping(string => Module) storage modules,
        mapping(string => uint256) storage moduleNameToTokenId,
        string calldata name
    ) external view returns (Module[] memory result) {
        Module[] memory resTraversed;
        uint256 size;

        (resTraversed, size) = Traverse.traverseDependencies(
            modules,
            moduleNameToTokenId,
            modules[name],
            0
        );

        result = new Module[](size - 1);

        for (uint256 i = 0; i < size - 1; i++) {
            result[i] = resTraversed[i + 1];
        }
    }

    function getModuleValueJSON(
        mapping(string => Module) storage modules,
        mapping(string => uint256) storage moduleNameToTokenId,
        Module calldata m
    ) external view returns (string memory result) {
        Module[] memory res;
        uint256 size;

        (res, size) = Traverse.traverseDependencies(
            modules,
            moduleNameToTokenId,
            m,
            0
        );

        return getJSONForModules(res, size);
    }

    function getModuleSeedValueJSON(
        mapping(string => Module) storage modules,
        mapping(string => uint256) storage moduleNameToTokenId,
        Module calldata m,
        uint256 seed
    ) external view returns (string memory result) {
        Module[] memory res;
        uint256 size;

        string[] memory dependencies = new string[](1);
        dependencies[0] = m.name;

        (res, size) = Traverse.traverseDependencies(
            modules,
            moduleNameToTokenId,
            m,
            1
        );

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
