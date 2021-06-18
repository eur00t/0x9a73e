// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

import "./Base64.sol";
import "./Traverse.sol";
import "./SharedDefinitions.sol";

library CodeModulesRendering {
    using Base64 for string;
    using StringsUpgradeable for uint256;

    function strConcat(string memory _a, string memory _b)
        internal
        pure
        returns (string memory result)
    {
        result = string(abi.encodePacked(bytes(_a), bytes(_b)));
    }

    function strConcat(string memory _a, bytes32 _b)
        internal
        pure
        returns (string memory result)
    {
        result = string(abi.encodePacked(bytes(_a), _b));
    }

    function strConcat3(
        string memory s1,
        string memory s2,
        string memory s3
    ) internal pure returns (string memory result) {
        result = string(abi.encodePacked(bytes(s1), bytes(s2), bytes(s3)));
    }

    function strConcat3(
        string memory s1,
        bytes32 s2,
        string memory s3
    ) internal pure returns (string memory result) {
        result = string(abi.encodePacked(bytes(s1), s2, bytes(s3)));
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

    function join(bytes32[] memory arr, string memory sep)
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
        returns (string memory)
    {
        return strConcat3('"', str, '"');
    }

    function stringToJSON(bytes32 str) internal pure returns (string memory) {
        return strConcat3('"', str, '"');
    }

    function dictToJSON(string[] memory keys, string[] memory values)
        internal
        pure
        returns (string memory)
    {
        assert(keys.length == values.length);

        string[] memory arr = new string[](keys.length);

        for (uint256 i = 0; i < keys.length; i++) {
            arr[i] = strConcat3(stringToJSON(keys[i]), string(": "), values[i]);
        }

        return strConcat3("{", join(arr, ", "), "}");
    }

    function arrToJSON(string[] memory arr)
        internal
        pure
        returns (string memory)
    {
        return strConcat3("[", join(arr, ", "), "]");
    }

    function strArrToJSON(string[] memory arr)
        internal
        pure
        returns (string memory)
    {
        if (arr.length == 0) {
            return "[]";
        }

        return strConcat3('["', join(arr, '", "'), '"]');
    }

    function strArrToJSON(bytes32[] memory arr)
        internal
        pure
        returns (string memory)
    {
        if (arr.length == 0) {
            return "[]";
        }

        return strConcat3('["', join(arr, '", "'), '"]');
    }

    function moduleToJSON(SharedDefinitions.Module memory m)
        internal
        pure
        returns (string memory)
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

    function getJSONForModules(
        SharedDefinitions.Module[] memory traversedModules,
        uint256 size
    ) internal pure returns (string memory) {
        string[] memory arr = new string[](size);
        for (uint256 i = 0; i < size; i++) {
            arr[i] = moduleToJSON(traversedModules[i]);
        }

        return arrToJSON(arr);
    }

    function getAllDependencies(
        mapping(bytes32 => SharedDefinitions.Module) storage modules,
        mapping(bytes32 => uint256) storage moduleNameToTokenId,
        bytes32 name
    ) external view returns (SharedDefinitions.Module[] memory result) {
        SharedDefinitions.Module[] memory resTraversed;
        uint256 size;

        (resTraversed, size) = Traverse.traverseDependencies(
            modules,
            moduleNameToTokenId,
            modules[name],
            0
        );

        result = new SharedDefinitions.Module[](size - 1);

        for (uint256 i = 0; i < size - 1; i++) {
            result[i] = resTraversed[i];
        }
    }

    function getModuleValueJSON(
        mapping(bytes32 => SharedDefinitions.Module) storage modules,
        mapping(bytes32 => uint256) storage moduleNameToTokenId,
        SharedDefinitions.Module calldata m
    ) external view returns (string memory) {
        SharedDefinitions.Module[] memory res;
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
        mapping(bytes32 => SharedDefinitions.Module) storage modules,
        mapping(bytes32 => uint256) storage moduleNameToTokenId,
        SharedDefinitions.Module calldata m,
        uint256 seed
    ) external view returns (string memory) {
        SharedDefinitions.Module[] memory res;
        uint256 size;

        bytes32[] memory dependencies = new bytes32[](1);
        dependencies[0] = m.name;

        (res, size) = Traverse.traverseDependencies(
            modules,
            moduleNameToTokenId,
            m,
            0
        );

        res[size] = SharedDefinitions.Module({
            name: "module-invocation",
            metadataJSON: "",
            dependencies: dependencies,
            code: strConcat3('(f) => f("', seed.toHexString(), '")').encode(),
            isInvocable: false
        });

        return getJSONForModules(res, size + 1);
    }
}
