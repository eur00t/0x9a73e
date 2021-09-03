// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

import "./Base64.sol";
import "./SharedDefinitions.sol";
import "./CodeModulesRendering.sol";

contract CodeModules is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using Base64 for string;
    using StringsUpgradeable for uint256;

    CountersUpgradeable.Counter private _tokenIdCounter;

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    uint256 internal _networkId;
    bytes32 internal _baseURIPrefix;

    function setBaseURIPrefix(bytes32 baseURIPrefix) external onlyOwner {
        _baseURIPrefix = baseURIPrefix;
    }

    function bytes32ToBytes(bytes32 value)
        internal
        pure
        returns (bytes memory)
    {
        uint256 length = 0;
        while (value[length] != 0) {
            length++;
        }

        bytes memory result = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = value[i];
        }

        return result;
    }

    function _baseURI() internal view override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    bytes32ToBytes(_baseURIPrefix),
                    bytes("/network/"),
                    bytes(_networkId.toString()),
                    bytes("/tokens/")
                )
            );
    }

    struct ModuleView {
        address owner;
        bool isInvocable;
        bool isFinalized;
        uint256 tokenId;
        uint256 invocationsNum;
        uint256 invocationsMax;
        bytes32 name;
        bytes32[] dependencies;
        ModuleViewBrief[] allDependencies;
        string code;
        string metadataJSON;
        uint256 invocationFeeInWei;
    }

    struct ModuleViewBrief {
        address owner;
        bool isInvocable;
        bool isFinalized;
        uint256 tokenId;
        uint256 invocationsNum;
        uint256 invocationsMax;
        bytes32 name;
        bytes32[] dependencies;
        string metadataJSON;
    }

    struct InvocableState {
        uint256[] invocations;
        uint256 invocationsMax;
    }

    struct Invocation {
        bytes32 moduleName;
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

    mapping(bytes32 => SharedDefinitions.Module) internal modules;
    mapping(bytes32 => bool) internal moduleExists;
    mapping(bytes32 => bool) internal moduleFinalized;
    mapping(bytes32 => InvocableState) internal moduleInvocableState;
    mapping(bytes32 => uint256) internal moduleNameToTokenId;

    mapping(uint256 => Invocation) internal tokenIdToInvocation;
    mapping(uint256 => bytes32) internal tokenIdToModuleName;

    struct Template {
        string beforeInject;
        string afterInject;
    }

    Template internal template;

    mapping(bytes32 => uint256) internal moduleNameToInvocationFeeInWei;
    uint256 public lambdaInvocationFee;
    address payable public lambdaWallet;

    function setLambdaInvocationFee(uint256 _lambdaInvocationFee)
        public
        onlyOwner
    {
        lambdaInvocationFee = _lambdaInvocationFee;
    }

    function setLambdaWallet(address payable _lambdaWallet) public onlyOwner {
        lambdaWallet = _lambdaWallet;
    }

    function toInvocationView(uint256 tokenId)
        internal
        view
        returns (InvocationView memory res)
    {
        res.module = toModuleViewBrief(
            modules[tokenIdToInvocation[tokenId].moduleName]
        );
        res.seed = tokenIdToInvocation[tokenId].seed.toHexString();
        res.owner = ownerOf(tokenId);
        res.tokenId = tokenId;
    }

    function toModuleView(
        SharedDefinitions.Module memory m,
        bool skipAllDependencies
    ) internal view returns (ModuleView memory result) {
        SharedDefinitions.Module[] memory allDependencies =
            !skipAllDependencies
                ? CodeModulesRendering.getAllDependencies(
                    modules,
                    moduleNameToTokenId,
                    m.name
                )
                : new SharedDefinitions.Module[](0);

        ModuleViewBrief[] memory allDependenciesViewBrief =
            new ModuleViewBrief[](allDependencies.length);

        for (uint256 i = 0; i < allDependencies.length; i++) {
            allDependenciesViewBrief[i] = toModuleViewBrief(allDependencies[i]);
        }

        result.name = m.name;
        result.metadataJSON = m.metadataJSON;
        result.dependencies = m.dependencies;
        result.allDependencies = allDependenciesViewBrief;
        result.code = m.code;
        result.owner = ownerOf(moduleNameToTokenId[m.name]);
        result.tokenId = moduleNameToTokenId[m.name];
        result.isInvocable = m.isInvocable;
        result.isFinalized = moduleFinalized[m.name];
        result.invocationsNum = moduleInvocableState[m.name].invocations.length;
        result.invocationsMax = moduleInvocableState[m.name].invocationsMax;
        result.invocationFeeInWei = moduleNameToInvocationFeeInWei[m.name];
    }

    function toModuleViewBrief(SharedDefinitions.Module memory m)
        internal
        view
        returns (ModuleViewBrief memory result)
    {
        result.name = m.name;
        result.metadataJSON = m.metadataJSON;
        result.dependencies = m.dependencies;
        result.owner = ownerOf(moduleNameToTokenId[m.name]);
        result.tokenId = moduleNameToTokenId[m.name];
        result.isInvocable = m.isInvocable;
        result.isFinalized = moduleFinalized[m.name];
        result.invocationsNum = moduleInvocableState[m.name].invocations.length;
        result.invocationsMax = moduleInvocableState[m.name].invocationsMax;
    }

    function tokenIsModule(uint256 tokenId) internal view returns (bool) {
        return moduleExists[tokenIdToModuleName[tokenId]];
    }

    function tokenIsInvocation(uint256 tokenId) internal view returns (bool) {
        return tokenIdToInvocation[tokenId].seed != 0;
    }

    function finalize(bytes32 name) external {
        require(moduleExists[name], "module must exist");
        require(!moduleFinalized[name], "module is finalized");
        address tokenOwner = ownerOf(moduleNameToTokenId[name]);
        require(tokenOwner == msg.sender, "only module owner can change it");

        moduleFinalized[name] = true;
    }

    function setInvocable(
        bytes32 name,
        uint256 invocationsMax,
        uint256 invocationFeeInWei
    ) external {
        require(moduleExists[name], "module must exist");
        require(!moduleFinalized[name], "module is finalized");
        require(modules[name].isInvocable, "module must be invocable");
        address tokenOwner = ownerOf(moduleNameToTokenId[name]);
        require(tokenOwner == msg.sender, "only module owner can change it");

        moduleFinalized[name] = true;
        moduleInvocableState[name].invocationsMax = invocationsMax;
        moduleNameToInvocationFeeInWei[name] = invocationFeeInWei;
    }

    function createInvocation(bytes32 moduleName)
        external
        payable
        returns (uint256)
    {
        require(
            msg.value >= moduleNameToInvocationFeeInWei[moduleName],
            "Insufficient fee"
        );
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

        if (msg.value > 0) {
            uint256 invocationFeeInWei =
                moduleNameToInvocationFeeInWei[moduleName];
            uint256 refund = msg.value - invocationFeeInWei;

            if (refund > 0) {
                payable(msg.sender).transfer(refund);
            }

            uint256 lambdaFee =
                (invocationFeeInWei / 100) * lambdaInvocationFee;

            if (lambdaFee > 0) {
                lambdaWallet.transfer(lambdaFee);
            }

            uint256 creatorFee = invocationFeeInWei - lambdaFee;

            if (creatorFee > 0) {
                payable(ownerOf(moduleNameToTokenId[moduleName])).transfer(
                    creatorFee
                );
            }
        }

        return tokenId;
    }

    function setTemplate(string calldata beforeStr, string calldata afterStr)
        external
        onlyOwner
    {
        template.beforeInject = beforeStr;
        template.afterInject = afterStr;
    }

    function createModule(
        bytes32 name,
        string calldata metadataJSON,
        bytes32[] calldata dependencies,
        string calldata code,
        bool isInvocable
    ) external {
        require(name != "", "module name must not be empty");
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

        modules[name] = SharedDefinitions.Module({
            name: name,
            metadataJSON: metadataJSON,
            dependencies: dependencies,
            code: code,
            isInvocable: isInvocable
        });
        moduleExists[name] = true;
    }

    function updateModule(
        bytes32 name,
        string calldata metadataJSON,
        bytes32[] memory dependencies,
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

    function exists(bytes32 name) external view returns (bool result) {
        return moduleExists[name];
    }

    function getInvocation(uint256 tokenId)
        external
        view
        returns (InvocationView memory)
    {
        require(tokenIsInvocation(tokenId), "token must be an invocation");

        return toInvocationView(tokenId);
    }

    function getModules(bytes32[] memory moduleNames)
        external
        view
        returns (ModuleViewBrief[] memory result)
    {
        result = new ModuleViewBrief[](moduleNames.length);

        for (uint256 i = 0; i < moduleNames.length; i++) {
            SharedDefinitions.Module storage m = modules[moduleNames[i]];

            result[i] = toModuleViewBrief(m);
        }
    }

    function getModule(bytes32 name, bool skipAllDependencies)
        external
        view
        returns (ModuleView memory)
    {
        require(moduleExists[name], "module must exist");

        return toModuleView(modules[name], skipAllDependencies);
    }

    function getModuleInvocations(
        bytes32 moduleName,
        uint256 page,
        uint256 size
    )
        external
        view
        returns (InvocationModuleView[] memory result, uint256 total)
    {
        uint256 resultSize;
        uint256[] memory resultTokenIds;
        total = moduleInvocableState[moduleName].invocations.length;
        (resultTokenIds, resultSize) = getPagedResultIds(
            moduleInvocableState[moduleName].invocations,
            total,
            page,
            size,
            true
        );
        result = new InvocationModuleView[](resultSize);

        if (resultSize == 0) {
            return (result, total);
        }

        for (uint256 i = 0; i < resultSize; i++) {
            result[i].seed = tokenIdToInvocation[resultTokenIds[i]]
                .seed
                .toHexString();
            result[i].tokenId = resultTokenIds[i];
        }
    }

    function getOwnedModules(uint256 page, uint256 size)
        external
        view
        returns (ModuleViewBrief[] memory result, uint256 total)
    {
        uint256 totalOwnedTokens = balanceOf(msg.sender);

        uint256[] memory moduleTokenIds = new uint256[](totalOwnedTokens);
        for (uint256 i = 0; i < totalOwnedTokens; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i);
            if (tokenIsModule(tokenId)) {
                moduleTokenIds[total] = tokenId;
                total++;
            }
        }

        uint256 resultSize;
        uint256[] memory resultTokenIds;
        (resultTokenIds, resultSize) = getPagedResultIds(
            moduleTokenIds,
            total,
            page,
            size,
            true
        );
        result = new ModuleViewBrief[](resultSize);

        if (resultSize == 0) {
            return (result, total);
        }

        for (uint256 i = 0; i < resultSize; i++) {
            result[i] = toModuleViewBrief(
                modules[tokenIdToModuleName[resultTokenIds[i]]]
            );
        }
    }

    function getPagedResultIds(
        uint256[] memory all,
        uint256 total,
        uint256 page,
        uint256 size,
        bool reversed
    ) internal pure returns (uint256[] memory result, uint256) {
        uint256 tokensAfterPage = total - page * size;
        uint256 resultSize =
            tokensAfterPage < 0
                ? 0
                : (tokensAfterPage > size ? size : tokensAfterPage);
        result = new uint256[](resultSize);

        if (resultSize == 0) {
            return (result, resultSize);
        }

        uint256 i = reversed ? total - page * size : page * size;
        for (uint256 j = 0; j < resultSize; j++) {
            if (reversed) {
                i--;
            }

            result[j] = all[i];

            if (!reversed) {
                i++;
            }
        }

        return (result, resultSize);
    }

    function getOwnedInvocations(uint256 page, uint256 size)
        external
        view
        returns (InvocationView[] memory result, uint256 total)
    {
        uint256 totalOwnedTokens = balanceOf(msg.sender);

        uint256[] memory invocationTokenIds = new uint256[](totalOwnedTokens);
        for (uint256 i = 0; i < totalOwnedTokens; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i);
            if (tokenIsInvocation(tokenId)) {
                invocationTokenIds[total] = tokenId;
                total++;
            }
        }

        uint256 resultSize;
        uint256[] memory resultTokenIds;
        (resultTokenIds, resultSize) = getPagedResultIds(
            invocationTokenIds,
            total,
            page,
            size,
            true
        );
        result = new InvocationView[](resultSize);

        if (resultSize == 0) {
            return (result, total);
        }

        for (uint256 i = 0; i < resultSize; i++) {
            result[i] = toInvocationView(resultTokenIds[i]);
        }
    }

    function getHtml(uint256 tokenId) external view returns (string memory) {
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
                template.beforeInject,
                modulesJSON,
                template.afterInject
            );
    }

    function getHtmlPreview(
        bytes32[] calldata dependencies,
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
        SharedDefinitions.Module memory preview;

        preview.name = "module-preview";
        preview.metadataJSON = "";
        preview.dependencies = dependencies;
        preview.code = code;

        if (!isInvocable) {
            preview.isInvocable = false;
            modulesJSON = CodeModulesRendering.getModuleValueJSON(
                modules,
                moduleNameToTokenId,
                preview
            );
        } else {
            preview.isInvocable = true;
            modulesJSON = CodeModulesRendering.getModuleSeedValueJSON(
                modules,
                moduleNameToTokenId,
                preview,
                0
            );
        }

        return
            CodeModulesRendering.strConcat3(
                template.beforeInject,
                modulesJSON,
                template.afterInject
            );
    }

    function initialize(uint256 networkId, bytes32 baseURIPrefix)
        public
        initializer
    {
        __ERC721_init("lambdaNFT", "LNFT");
        __Ownable_init();

        _networkId = networkId;
        _baseURIPrefix = baseURIPrefix;

        moduleNameToTokenId["module-preview"] = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        moduleNameToTokenId["module-invocation"] = _tokenIdCounter.current();
        _tokenIdCounter.increment();
    }
}
