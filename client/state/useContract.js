import { useWeb3React } from "@web3-react/core";
import web3 from "web3";
import { useCallback, useMemo, useState } from "react";

import { abi } from "../code_modules_abi.json";
import { useNetwork } from "../utils/networks";
import { wrapFuncCancelable } from "../utils/wrapFuncCancelable";

const { asciiToHex, hexToAscii } = web3.utils;

const hexToAsciiWithTrim = (hex) => {
  return hexToAscii(hex).replace(/(\0)+$/, "");
};

const parseTemplate = (str) => {
  const match = str.match(/^([\s\S]*){{inject}}([\s\S]*)$/m);

  if (match === null) {
    throw Error();
  }

  const [, before, after] = match;

  return { before, after };
};

const processModuleResult = ({
  name,
  dependencies,
  invocationsNum,
  invocationsMax,
  ...rest
}) => ({
  name: hexToAsciiWithTrim(name),
  dependencies: dependencies.map((hex) => hexToAsciiWithTrim(hex)),
  invocationsNum: invocationsNum ? parseInt(invocationsNum, 10) : undefined,
  invocationsMax: invocationsMax ? parseInt(invocationsMax, 10) : undefined,
  ...rest,
});

const processModulesResult = (arr) => {
  return arr.map((module) => processModuleResult(module));
};

const processInvocationResult = ({ module, ...rest }) => ({
  module: processModuleResult(module),
  ...rest,
});

export const useContract = (trackTransaction) => {
  const { account, library: web3 } = useWeb3React();
  const [progress, setProgress] = useState(false);

  const network = useNetwork();

  let contract = useMemo(
    () =>
      network && web3
        ? new web3.eth.Contract(abi, network.contractAddress, {
            from: account,
          })
        : null,
    [web3, network, account]
  );

  const checkIfModuleExists = useCallback(
    wrapFuncCancelable((name) =>
      contract.methods.exists(asciiToHex(name)).call()
    ),
    [contract]
  );

  const setModule = useCallback(
    wrapFuncCancelable(
      async (
        scopeId,
        { name, dependencies, code, metadataJSON, isInvocable }
      ) => {
        try {
          setProgress(true);

          const exists = await contract.methods.exists(asciiToHex(name)).call();
          if (exists) {
            await trackTransaction(
              scopeId,
              contract.methods
                .updateModule(
                  asciiToHex(name),
                  metadataJSON,
                  dependencies.map((str) => asciiToHex(str)),
                  btoa(code),
                  isInvocable
                )
                .send()
            );
          } else {
            await trackTransaction(
              scopeId,
              contract.methods
                .createModule(
                  asciiToHex(name),
                  metadataJSON,
                  dependencies.map((str) => asciiToHex(str)),
                  btoa(code),
                  isInvocable
                )
                .send()
            );
          }
        } finally {
          setProgress(false);
        }
      }
    ),
    [contract, setProgress, trackTransaction]
  );

  const setTemplate = useCallback(
    wrapFuncCancelable(async (scopeId, templateValue) => {
      try {
        setProgress(true);

        const { before, after } = parseTemplate(templateValue);
        await trackTransaction(
          scopeId,
          contract.methods.setTemplate(before, after).send()
        );
      } catch (e) {
      } finally {
        setProgress(false);
      }
    }),
    [contract, setProgress, trackTransaction]
  );

  const getHtml = useCallback(
    wrapFuncCancelable((tokenId) => contract.methods.getHtml(tokenId).call()),
    [contract]
  );

  const tokenURI = useCallback(
    wrapFuncCancelable((tokenId) => contract.methods.tokenURI(tokenId).call()),
    [contract]
  );

  const getHtmlPreview = useCallback(
    wrapFuncCancelable((dependencies, code, isInvocable) => {
      let moduleConstructor;

      try {
        moduleConstructor = eval(code);
      } catch (e) {
        return "";
      }

      if (typeof moduleConstructor !== "function") {
        return "";
      }

      return contract.methods
        .getHtmlPreview(
          dependencies.map((str) => asciiToHex(str)),
          btoa(code),
          isInvocable
        )
        .call();
    }),
    [contract]
  );

  const getInvocation = useCallback(
    wrapFuncCancelable(async (tokenId) =>
      processInvocationResult(
        await contract.methods.getInvocation(tokenId).call()
      )
    ),
    [contract]
  );

  const getAllModules = useCallback(
    wrapFuncCancelable(async () =>
      processModulesResult(await contract.methods.getAllModules().call())
    ),
    [contract]
  );

  const getOwnedModules = useCallback(
    wrapFuncCancelable(async (page = 0, size = 10) => {
      const { result, total } = await contract.methods
        .getOwnedModules(page, size)
        .call();

      return { result: processModulesResult(result), total };
    }),
    [contract]
  );

  const getOwnedInvocations = useCallback(
    wrapFuncCancelable(async (page = 0, size = 10) => {
      const { result, total } = await contract.methods
        .getOwnedInvocations(page, size)
        .call();

      return { result: result.map(processInvocationResult), total };
    }),
    [contract]
  );

  const getAllFeatured = useCallback(
    wrapFuncCancelable(async (moduleNames = []) =>
      processModulesResult(
        await contract.methods
          .getModules(moduleNames.map((str) => asciiToHex(str)))
          .call()
      )
    ),
    [contract]
  );

  const getModule = useCallback(
    wrapFuncCancelable(async (moduleName) => {
      const { code, name, dependencies, allDependencies, ...rest } =
        await contract.methods.getModule(asciiToHex(moduleName)).call();

      return processModuleResult({
        code: atob(code),
        name,
        dependencies,
        allDependencies: processModulesResult(allDependencies),
        ...rest,
      });
    }),
    [contract]
  );

  const getModuleInvocations = useCallback(
    wrapFuncCancelable(
      async (moduleName, page = 0, size = 10) =>
        await contract.methods
          .getModuleInvocations(asciiToHex(moduleName), page, size)
          .call()
    ),
    [contract]
  );

  const finalize = useCallback(
    wrapFuncCancelable((scopeId, moduleName) =>
      trackTransaction(
        scopeId,
        contract.methods.finalize(asciiToHex(moduleName)).send()
      )
    ),
    [contract, trackTransaction]
  );

  const setInvocable = useCallback(
    wrapFuncCancelable((scopeId, moduleName, invocationsMax) =>
      trackTransaction(
        scopeId,
        contract.methods
          .setInvocable(asciiToHex(moduleName), invocationsMax)
          .send()
      )
    ),
    [contract, trackTransaction]
  );

  const createInvocation = useCallback(
    wrapFuncCancelable((scopeId, moduleName, doneOptions) =>
      trackTransaction(
        scopeId,
        contract.methods.createInvocation(asciiToHex(moduleName)).send(),
        doneOptions
      )
    ),
    [contract, trackTransaction]
  );

  return {
    progress,
    setModule,
    setTemplate,
    getHtml,
    tokenURI,
    getHtmlPreview,
    getInvocation,
    getModule,
    getModuleInvocations,
    getAllModules,
    getOwnedModules,
    getOwnedInvocations,
    getAllFeatured,
    finalize,
    setInvocable,
    createInvocation,
    checkIfModuleExists,
  };
};
