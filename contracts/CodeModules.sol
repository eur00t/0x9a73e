// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./Base64.sol";
import "./definitions.sol";
import "./CodeModulesRendering.sol";

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

    uint256 internal _networkId;

    function _baseURI() internal view override returns (string memory) {
        return
            CodeModulesRendering.strConcat3(
                "https://9a73e.website/network/",
                _networkId.toString(),
                "/tokens/"
            );
    }

    struct ModuleView {
        string name;
        string metadataJSON;
        string[] dependencies;
        ModuleViewBrief[] allDependencies;
        string code;
        address owner;
        uint256 tokenId;
        bool isFeatured;
        bool isInvocable;
        bool isFinalized;
        InvocationModuleView[] invocations;
        uint256 invocationsMax;
    }

    struct ModuleViewBrief {
        string name;
        string metadataJSON;
        string[] dependencies;
        address owner;
        uint256 tokenId;
        bool isFeatured;
        bool isInvocable;
        bool isFinalized;
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
        string seed;
        uint256 tokenId;
    }

    struct InvocationModuleView {
        uint256 tokenId;
        string seed;
    }

    mapping(string => Module) internal modules;
    mapping(string => bool) internal moduleExists;

    mapping(string => bool) internal moduleFinalized;
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

    function finalize(string calldata name) external {
        require(moduleExists[name], "module must exist");
        require(!moduleFinalized[name], "modules is finalized");
        address tokenOwner = ownerOf(moduleNameToTokenId[name]);
        require(tokenOwner == msg.sender, "only module owner can change it");

        moduleFinalized[name] = true;
    }

    function setInvocable(string calldata name, uint256 invocationsMax)
        external
    {
        require(moduleExists[name], "module must exist");
        require(!moduleFinalized[name], "modules is finalized");
        require(modules[name].isInvocable, "module must be invocable");
        address tokenOwner = ownerOf(moduleNameToTokenId[name]);
        require(tokenOwner == msg.sender, "only module owner can change it");

        moduleFinalized[name] = true;
        moduleInvocableState[name].invocationsMax = invocationsMax;
    }

    function createInvocation(string calldata moduleName)
        external
        returns (uint256)
    {
        require(moduleExists[moduleName], "module must exist");
        require(modules[moduleName].isInvocable, "module must be invocable");
        require(moduleFinalized[moduleName], "module must be finalized");
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
                seed: tokenIdToInvocation[tokenId].seed.toHexString(),
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

    function setFeatured(string calldata name) external onlyOwner {
        require(moduleExists[name], "module must exist");
        if (featuredState[name] == FEATURED_SET) {
            return;
        }

        if (featuredState[name] == FEATURED_UNKNOWN) {
            probablyFeaturedList.push(name);
        }

        featuredState[name] = FEATURED_SET;
    }

    function unsetFeatured(string calldata name) external onlyOwner {
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

    function setTemplate(string calldata beforeStr, string calldata afterStr)
        external
        onlyOwner
    {
        templateBefore = beforeStr;
        templateAfter = afterStr;
    }

    function setBefore(string calldata str) external onlyOwner {
        templateBefore = str;
    }

    function setAfter(string calldata str) external onlyOwner {
        templateAfter = str;
    }

    function exists(string calldata name) external view returns (bool result) {
        return moduleExists[name];
    }

    function getModule(string calldata name)
        external
        view
        returns (ModuleView memory result)
    {
        require(moduleExists[name], "module must exist");

        return toModuleView(modules[name]);
    }

    function toModuleView(Module memory m)
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
                    .seed
                    .toHexString(),
                tokenId: moduleInvocableState[m.name].invocations[i]
            });
        }

        Module[] memory allDependencies =
            CodeModulesRendering.getAllDependencies(
                modules,
                moduleNameToTokenId,
                m.name
            );

        ModuleViewBrief[] memory allDependenciesViewBrief =
            new ModuleViewBrief[](allDependencies.length);

        for (uint256 i = 0; i < allDependencies.length; i++) {
            allDependenciesViewBrief[i] = toModuleViewBrief(allDependencies[i]);
        }

        return
            ModuleView({
                name: m.name,
                metadataJSON: m.metadataJSON,
                dependencies: m.dependencies,
                allDependencies: allDependenciesViewBrief,
                code: m.code,
                owner: ownerOf(moduleNameToTokenId[m.name]),
                tokenId: moduleNameToTokenId[m.name],
                isFeatured: (featuredState[m.name] == 1) ? true : false,
                isInvocable: m.isInvocable,
                isFinalized: moduleFinalized[m.name],
                invocations: invocations,
                invocationsMax: moduleInvocableState[m.name].invocationsMax
            });
    }

    function toModuleViewBrief(Module memory m)
        internal
        view
        returns (ModuleViewBrief memory result)
    {
        return
            ModuleViewBrief({
                name: m.name,
                metadataJSON: m.metadataJSON,
                dependencies: m.dependencies,
                owner: ownerOf(moduleNameToTokenId[m.name]),
                tokenId: moduleNameToTokenId[m.name],
                isFeatured: (featuredState[m.name] == 1) ? true : false,
                isInvocable: m.isInvocable,
                isFinalized: moduleFinalized[m.name],
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
        string calldata name,
        string calldata metadataJSON,
        string[] calldata dependencies,
        string calldata code,
        bool isInvocable
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
            metadataJSON: metadataJSON,
            dependencies: dependencies,
            code: code,
            isInvocable: isInvocable
        });
        moduleExists[name] = true;
    }

    function updateModule(
        string calldata name,
        string calldata metadataJSON,
        string[] memory dependencies,
        string calldata code,
        bool isInvocable
    ) external {
        require(moduleExists[name], "module must exist");
        require(!moduleFinalized[name], "module is finalized");
        address tokenOwner = ownerOf(moduleNameToTokenId[name]);
        require(tokenOwner == msg.sender, "only module owner can update it");

        modules[name].metadataJSON = metadataJSON;
        modules[name].dependencies = dependencies;
        modules[name].code = code;
        modules[name].isInvocable = isInvocable;
    }

    function getHtml(uint256 tokenId)
        external
        view
        returns (string memory result)
    {
        string memory modulesJSON;

        if (tokenIsInvocation(tokenId)) {
            modulesJSON = CodeModulesRendering.getModuleSeedValueJSON(
                modules,
                moduleNameToTokenId,
                modules[tokenIdToInvocation[tokenId].moduleName],
                tokenIdToInvocation[tokenId].seed
            );
        } else if (tokenIsModule(tokenId)) {
            if (modules[tokenIdToModuleName[tokenId]].isInvocable) {
                modulesJSON = CodeModulesRendering.getModuleSeedValueJSON(
                    modules,
                    moduleNameToTokenId,
                    modules[tokenIdToModuleName[tokenId]],
                    0
                );
            } else {
                modulesJSON = CodeModulesRendering.getModuleValueJSON(
                    modules,
                    moduleNameToTokenId,
                    modules[tokenIdToModuleName[tokenId]]
                );
            }
        } else {
            revert("token does not exist");
        }

        return
            CodeModulesRendering.strConcat3(
                templateBefore,
                modulesJSON,
                templateAfter
            );
    }

    function getHtmlPreview(
        string[] calldata dependencies,
        string calldata code,
        bool isInvocable
    ) external view returns (string memory result) {
        for (uint256 i = 0; i < dependencies.length; i++) {
            require(
                moduleExists[dependencies[i]],
                "all dependencies must exist"
            );
        }

        string memory modulesJSON;

        if (!isInvocable) {
            modulesJSON = CodeModulesRendering.getModuleValueJSON(
                modules,
                moduleNameToTokenId,
                Module({
                    name: "module-preview",
                    metadataJSON: "",
                    dependencies: dependencies,
                    code: code,
                    isInvocable: false
                })
            );
        } else {
            modulesJSON = CodeModulesRendering.getModuleSeedValueJSON(
                modules,
                moduleNameToTokenId,
                Module({
                    name: "module-preview",
                    metadataJSON: "",
                    dependencies: dependencies,
                    code: code,
                    isInvocable: true
                }),
                0
            );
        }

        return
            CodeModulesRendering.strConcat3(
                templateBefore,
                modulesJSON,
                templateAfter
            );
    }

    constructor(uint256 networkId) ERC721("CodeModules", "CDM") {
        _networkId = networkId;

        moduleNameToTokenId["module-preview"] = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        moduleNameToTokenId["module-invocation"] = _tokenIdCounter.current();
        _tokenIdCounter.increment();
    }
}
