// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CodeModules is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    struct Module {
        string name;
        string[] dependencies;
        string code;
    }

    struct ModuleView {
        string name;
        string[] dependencies;
        string code;
        address owner;
        uint256 tokenId;
        bool isFeatured;
    }

    struct ModuleViewBrief {
        string name;
        string[] dependencies;
        address owner;
        uint256 tokenId;
        bool isFeatured;
    }

    mapping(string => Module) internal modules;
    mapping(string => bool) internal moduleExists;
    mapping(uint256 => string) internal tokenIdToModuleName;
    mapping(string => uint256) internal moduleNameToTokenId;

    string internal templateBefore;
    string internal templateAfter;

    uint8 internal constant FEATURED_UNKNOWN = 0;
    uint8 internal constant FEATURED_SET = 1;
    uint8 internal constant FEATURED_UNSET = 2;
    string[] internal probablyFeaturedList;
    mapping(string => uint8) internal featuredState;

    function setFeatured(string memory name) external onlyOwner {
        require(moduleExists[name], "module must exist");
        if (featuredState[name] == FEATURED_SET) {
            return;
        }

        if (featuredState[name] == FEATURED_UNKNOWN) {
            probablyFeaturedList.push(name);
        }

        featuredState[name] = FEATURED_SET;
    }

    function unsetFeatured(string memory name) external onlyOwner {
        require(moduleExists[name], "module must exist");
        if (featuredState[name] == FEATURED_UNSET) {
            return;
        }

        if (featuredState[name] == FEATURED_SET) {
            featuredState[name] = FEATURED_UNSET;
        }
    }

    function getAllFeatured()
        external
        view
        returns (ModuleViewBrief[] memory result)
    {
        string[] memory featuredList =
            new string[](probablyFeaturedList.length);
        uint256 featuredListLength = 0;

        for (uint256 i = 0; i < probablyFeaturedList.length; i++) {
            if (featuredState[probablyFeaturedList[i]] == FEATURED_SET) {
                featuredList[featuredListLength] = probablyFeaturedList[i];
                featuredListLength++;
            }
        }

        result = new ModuleViewBrief[](featuredListLength);

        for (uint256 i = 0; i < featuredListLength; i++) {
            Module storage m = modules[featuredList[i]];

            result[i] = toModuleViewBrief(m);
        }

        return result;
    }

    function setTemplate(string memory beforeStr, string memory afterStr)
        external
        onlyOwner
    {
        templateBefore = beforeStr;
        templateAfter = afterStr;
    }

    function setBefore(string memory str) external onlyOwner {
        templateBefore = str;
    }

    function setAfter(string memory str) external onlyOwner {
        templateAfter = str;
    }

    function exists(string memory name) external view returns (bool result) {
        return moduleExists[name];
    }

    function getModule(string memory name)
        external
        view
        returns (ModuleView memory result)
    {
        require(moduleExists[name], "module must exist");

        return toModuleView(modules[name]);
    }

    function toModuleView(Module storage m)
        internal
        view
        returns (ModuleView memory result)
    {
        return
            ModuleView({
                owner: ownerOf(moduleNameToTokenId[m.name]),
                tokenId: moduleNameToTokenId[m.name],
                name: m.name,
                dependencies: m.dependencies,
                isFeatured: (featuredState[m.name] == 1) ? true : false,
                code: m.code
            });
    }

    function toModuleViewBrief(Module storage m)
        internal
        view
        returns (ModuleViewBrief memory result)
    {
        return
            ModuleViewBrief({
                owner: ownerOf(moduleNameToTokenId[m.name]),
                tokenId: moduleNameToTokenId[m.name],
                name: m.name,
                dependencies: m.dependencies,
                isFeatured: (featuredState[m.name] == 1) ? true : false
            });
    }

    function getAllModules()
        external
        view
        returns (ModuleViewBrief[] memory result)
    {
        uint256 totalTokens = totalSupply();
        result = new ModuleViewBrief[](totalTokens);

        for (uint256 i = 0; i < totalTokens; i++) {
            result[i] = toModuleViewBrief(
                modules[tokenIdToModuleName[tokenByIndex(i)]]
            );
        }

        return result;
    }

    function getOwnedModules()
        external
        view
        returns (ModuleViewBrief[] memory result)
    {
        uint256 totalOwnedModules = balanceOf(msg.sender);
        result = new ModuleViewBrief[](totalOwnedModules);

        for (uint256 i = 0; i < totalOwnedModules; i++) {
            result[i] = toModuleViewBrief(
                modules[tokenIdToModuleName[tokenOfOwnerByIndex(msg.sender, i)]]
            );
        }

        return result;
    }

    function createModule(
        string memory name,
        string[] memory dependencies,
        string memory code
    ) external {
        for (uint256 i = 0; i < dependencies.length; i++) {
            require(
                moduleExists[dependencies[i]],
                "all dependencies must exist"
            );
        }

        require(!moduleExists[name], "module already exists");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(msg.sender, tokenId);

        tokenIdToModuleName[tokenId] = name;
        moduleNameToTokenId[name] = tokenId;

        modules[name] = Module({
            name: name,
            dependencies: dependencies,
            code: code
        });
        moduleExists[name] = true;
    }

    function updateModule(
        string memory name,
        string[] memory dependencies,
        string memory code
    ) external {
        require(moduleExists[name], "module must exist");
        address tokenOwner = ownerOf(moduleNameToTokenId[name]);
        require(tokenOwner == msg.sender, "only module owner can update it");

        modules[name].dependencies = dependencies;
        modules[name].code = code;
    }

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

    function getHtml(string memory name)
        external
        view
        returns (string memory result)
    {
        require(moduleExists[name], "module doesn't exist");

        string[128] memory stack;
        stack[0] = name;
        uint8 iStack = 1;

        Module[128] memory res;
        uint8 iRes = 0;

        while (iStack > 0) {
            iStack--;
            Module memory m = modules[stack[iStack]];
            res[iRes] = m;
            iRes++;

            for (uint256 i = 0; i < m.dependencies.length; i++) {
                stack[iStack] = m.dependencies[i];
                iStack++;
            }
        }

        string[] memory arr = new string[](iRes);
        for (uint256 i = 0; i < iRes; i++) {
            arr[i] = moduleToJSON(res[i]);
        }

        string memory modulesJSON = arrToJSON(arr);

        return strConcat3(templateBefore, modulesJSON, templateAfter);
    }

    constructor() ERC721("CodeModules", "CDM") {}
}
