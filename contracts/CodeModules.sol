// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./Base64.sol";

contract CodeModules is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    using Base64 for string;
    using Strings for uint256;

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
        bool isInvocable;
        InvocationModuleView[] invocations;
        uint256 invocationsMax;
    }

    struct ModuleViewBrief {
        string name;
        string[] dependencies;
        address owner;
        uint256 tokenId;
        bool isFeatured;
        bool isInvocable;
        uint256 invocationsNum;
        uint256 invocationsMax;
    }

    struct InvocableState {
        uint256[] invocations;
        uint256 invocationsMax;
    }

    struct Invocation {
        string moduleName;
        uint256 seed;
    }

    struct InvocationView {
        ModuleViewBrief module;
        address owner;
        uint256 seed;
        uint256 tokenId;
    }

    struct InvocationModuleView {
        uint256 tokenId;
        uint256 seed;
    }

    mapping(string => Module) internal modules;
    mapping(string => bool) internal moduleExists;

    mapping(string => bool) internal moduleInvocable;
    mapping(string => InvocableState) internal moduleInvocableState;

    mapping(uint256 => Invocation) internal tokenIdToInvocation;

    mapping(uint256 => string) internal tokenIdToModuleName;
    mapping(string => uint256) internal moduleNameToTokenId;

    string internal templateBefore;
    string internal templateAfter;

    uint8 internal constant FEATURED_UNKNOWN = 0;
    uint8 internal constant FEATURED_SET = 1;
    uint8 internal constant FEATURED_UNSET = 2;
    string[] internal probablyFeaturedList;
    mapping(string => uint8) internal featuredState;

    function setInvocable(string memory name, uint256 invocationsMax) external {
        require(moduleExists[name], "module must exist");
        address tokenOwner = ownerOf(moduleNameToTokenId[name]);
        require(tokenOwner == msg.sender, "only module owner can change it");

        moduleInvocable[name] = true;
        moduleInvocableState[name].invocationsMax = invocationsMax;
    }

    function createInvocation(string memory moduleName)
        external
        returns (uint256)
    {
        require(moduleExists[moduleName], "module must exist");
        require(moduleInvocable[moduleName], "module must be invocable");
        require(
            moduleInvocableState[moduleName].invocations.length <
                moduleInvocableState[moduleName].invocationsMax,
            "invocations limit reached"
        );

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(msg.sender, tokenId);

        moduleInvocableState[moduleName].invocations.push(tokenId);
        tokenIdToInvocation[tokenId] = Invocation({
            moduleName: moduleName,
            seed: uint256(
                keccak256(
                    abi.encodePacked(
                        moduleInvocableState[moduleName].invocations.length,
                        block.number,
                        msg.sender
                    )
                )
            )
        });

        return tokenId;
    }

    function toInvocationView(uint256 tokenId)
        internal
        view
        returns (InvocationView memory)
    {
        return
            InvocationView({
                module: toModuleViewBrief(
                    modules[tokenIdToInvocation[tokenId].moduleName]
                ),
                seed: tokenIdToInvocation[tokenId].seed,
                owner: ownerOf(tokenId),
                tokenId: tokenId
            });
    }

    function getInvocation(uint256 tokenId)
        external
        view
        returns (InvocationView memory)
    {
        require(tokenIsInvocation(tokenId), "token must be an invocation");

        return toInvocationView(tokenId);
    }

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
        InvocationModuleView[] memory invocations =
            new InvocationModuleView[](
                moduleInvocableState[m.name].invocations.length
            );

        for (
            uint256 i = 0;
            i < moduleInvocableState[m.name].invocations.length;
            i++
        ) {
            invocations[i] = InvocationModuleView({
                seed: tokenIdToInvocation[
                    moduleInvocableState[m.name].invocations[i]
                ]
                    .seed,
                tokenId: moduleInvocableState[m.name].invocations[i]
            });
        }

        return
            ModuleView({
                name: m.name,
                dependencies: m.dependencies,
                code: m.code,
                owner: ownerOf(moduleNameToTokenId[m.name]),
                tokenId: moduleNameToTokenId[m.name],
                isFeatured: (featuredState[m.name] == 1) ? true : false,
                isInvocable: moduleInvocable[m.name],
                invocations: invocations,
                invocationsMax: moduleInvocableState[m.name].invocationsMax
            });
    }

    function toModuleViewBrief(Module storage m)
        internal
        view
        returns (ModuleViewBrief memory result)
    {
        return
            ModuleViewBrief({
                name: m.name,
                dependencies: m.dependencies,
                owner: ownerOf(moduleNameToTokenId[m.name]),
                tokenId: moduleNameToTokenId[m.name],
                isFeatured: (featuredState[m.name] == 1) ? true : false,
                isInvocable: moduleInvocable[m.name],
                invocationsNum: moduleInvocableState[m.name].invocations.length,
                invocationsMax: moduleInvocableState[m.name].invocationsMax
            });
    }

    function tokenIsModule(uint256 tokenId) internal view returns (bool) {
        return moduleExists[tokenIdToModuleName[tokenId]];
    }

    function tokenIsInvocation(uint256 tokenId) internal view returns (bool) {
        return tokenIdToInvocation[tokenId].seed != 0;
    }

    function getAllModules()
        external
        view
        returns (ModuleViewBrief[] memory result)
    {
        uint256 totalTokens = totalSupply();
        uint256 totalModuleTokens = 0;

        for (uint256 i = 0; i < totalTokens; i++) {
            if (tokenIsModule(tokenByIndex(i))) {
                totalModuleTokens++;
            }
        }

        result = new ModuleViewBrief[](totalModuleTokens);

        uint256 j = 0;
        for (uint256 i = 0; i < totalTokens; i++) {
            if (tokenIsModule(tokenByIndex(i))) {
                result[j] = toModuleViewBrief(
                    modules[tokenIdToModuleName[tokenByIndex(i)]]
                );
                j++;
            }
        }

        return result;
    }

    function getOwnedModules()
        external
        view
        returns (ModuleViewBrief[] memory result)
    {
        uint256 totalOwnedTokens = balanceOf(msg.sender);
        uint256 totalOwnedModuleTokens = 0;

        for (uint256 i = 0; i < totalOwnedTokens; i++) {
            if (tokenIsModule(tokenOfOwnerByIndex(msg.sender, i))) {
                totalOwnedModuleTokens++;
            }
        }

        result = new ModuleViewBrief[](totalOwnedModuleTokens);

        uint256 j = 0;
        for (uint256 i = 0; i < totalOwnedTokens; i++) {
            if (tokenIsModule(tokenOfOwnerByIndex(msg.sender, i))) {
                result[j] = toModuleViewBrief(
                    modules[
                        tokenIdToModuleName[tokenOfOwnerByIndex(msg.sender, i)]
                    ]
                );
                j++;
            }
        }

        return result;
    }

    function getOwnedInvocations()
        external
        view
        returns (InvocationView[] memory result)
    {
        uint256 totalOwnedTokens = balanceOf(msg.sender);
        uint256 totalOwnedInvocationTokens = 0;

        for (uint256 i = 0; i < totalOwnedTokens; i++) {
            if (tokenIsInvocation(tokenOfOwnerByIndex(msg.sender, i))) {
                totalOwnedInvocationTokens++;
            }
        }

        result = new InvocationView[](totalOwnedInvocationTokens);

        uint256 j = 0;
        for (uint256 i = 0; i < totalOwnedTokens; i++) {
            if (tokenIsInvocation(tokenOfOwnerByIndex(msg.sender, i))) {
                result[j] = toInvocationView(
                    tokenOfOwnerByIndex(msg.sender, i)
                );
                j++;
            }
        }

        return result;
    }

    function createModule(
        string memory name,
        string[] memory dependencies,
        string memory code
    ) external {
        require(bytes(name).length > 0, "module name must not be empty");
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

    function traverseDependencies(string memory name, uint8 leftResultPadding)
        internal
        view
        returns (Module[128] memory result, uint8 size)
    {
        string[128] memory stack;
        stack[0] = name;
        uint8 iStack = 1;

        Module[128] memory res;
        uint8 iRes = leftResultPadding;

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

        return (res, iRes);
    }

    function getHtmlForModules(Module[128] memory traversedModules, uint8 size)
        internal
        view
        returns (string memory result)
    {
        string[] memory arr = new string[](size);
        for (uint256 i = 0; i < size; i++) {
            arr[i] = moduleToJSON(traversedModules[i]);
        }

        string memory modulesJSON = arrToJSON(arr);

        return strConcat3(templateBefore, modulesJSON, templateAfter);
    }

    function getModuleNonInvocableHtml(uint256 tokenId)
        internal
        view
        returns (string memory result)
    {
        Module[128] memory res;
        uint8 size;

        (res, size) = traverseDependencies(tokenIdToModuleName[tokenId], 0);

        return getHtmlForModules(res, size);
    }

    function getModuleHtml(uint256 tokenId)
        internal
        view
        returns (string memory result)
    {
        require(tokenIsModule(tokenId), "token must be a module");

        if (moduleInvocable[tokenIdToModuleName[tokenId]]) {
            return getSeedHtml(tokenIdToModuleName[tokenId], 0);
        } else {
            return getModuleNonInvocableHtml(tokenId);
        }
    }

    function getSeedHtml(string memory moduleName, uint256 seed)
        internal
        view
        returns (string memory result)
    {
        Module[128] memory res;
        uint8 size;

        (res, size) = traverseDependencies(moduleName, 1);

        string[] memory dependencies = new string[](1);
        dependencies[0] = moduleName;

        res[0] = Module({
            name: "module-invocation",
            dependencies: dependencies,
            code: strConcat3('(f) => f("', seed.toString(), '")').encode()
        });

        return getHtmlForModules(res, size);
    }

    function getInvocationHtml(uint256 tokenId)
        internal
        view
        returns (string memory result)
    {
        require(tokenIsInvocation(tokenId), "token must be an invocation");

        return
            getSeedHtml(
                tokenIdToInvocation[tokenId].moduleName,
                tokenIdToInvocation[tokenId].seed
            );
    }

    function getHtml(uint256 tokenId)
        external
        view
        returns (string memory result)
    {
        if (tokenIsInvocation(tokenId)) {
            return getInvocationHtml(tokenId);
        } else if (tokenIsModule(tokenId)) {
            return getModuleHtml(tokenId);
        } else {
            revert("token does not exist");
        }
    }

    constructor() ERC721("CodeModules", "CDM") {}
}
