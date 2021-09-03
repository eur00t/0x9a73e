const chai = require("chai");
const chaiSnapshot = require("mocha-chai-snapshot");

const { expect } = chai;
chai.use(chaiSnapshot);

describe("CodeModules", function () {
  let contract;

  const createModule = async (
    name,
    description,
    dependencies,
    code,
    isInvocable,
    addr
  ) => {
    const tx = await (addr ? contract.connect(addr) : contract).createModule(
      ethers.utils.formatBytes32String(name),
      JSON.stringify({ description }),
      dependencies.map((name) => ethers.utils.formatBytes32String(name)),
      code,
      isInvocable
    );
    await tx.wait();
  };

  const updateModuleRaw = async (
    name,
    description,
    dependencies,
    code,
    isInvocable,
    addr
  ) =>
    (addr ? contract.connect(addr) : contract).updateModule(
      ethers.utils.formatBytes32String(name),
      JSON.stringify({ description }),
      dependencies.map((name) => ethers.utils.formatBytes32String(name)),
      code,
      isInvocable
    );

  const updateModule = async (
    name,
    description,
    dependencies,
    code,
    isInvocable,
    addr
  ) => {
    const tx = await updateModuleRaw(
      name,
      description,
      dependencies,
      code,
      isInvocable,
      addr
    );
    await tx.wait();
  };

  const m = async (prefix, f) => {
    const cm = (num, deps) =>
      createModule(
        `${prefix}-${num}`,
        "test",
        deps.map((n) => `${prefix}-${n}`),
        "() => {}",
        false
      );

    const um = (num, deps) =>
      updateModule(
        `${prefix}-${num}`,
        "test",
        deps.map((n) => `${prefix}-${n}`),
        "() => {}",
        false
      );

    await f(cm, um);
  };

  const getModule = (name, skipAllDependencies = false) =>
    contract.getModule(
      ethers.utils.formatBytes32String(name),
      skipAllDependencies
    );

  let owner, addr1, addr2;
  before(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const CodeModulesRendering = await ethers.getContractFactory(
      "CodeModulesRendering"
    );
    const library = await CodeModulesRendering.deploy();
    const CodeModules = await ethers.getContractFactory("CodeModules", {
      libraries: {
        CodeModulesRendering: library.address,
      },
    });
    contract = await CodeModules.deploy();
  });

  it("initializes correctly", async () => {
    const initTx = await contract.initialize(
      42,
      ethers.utils.formatBytes32String("https://example.com")
    );
    await initTx.wait();

    await createModule("test-module", "test", [], "() => {}", true);

    const module = await getModule("test-module");

    expect(await module.name).to.equal(
      ethers.utils.formatBytes32String("test-module")
    );
    expect(await contract.tokenURI(module.tokenId)).to.matchSnapshot(this);
  });

  describe("dependency resolution", () => {
    before(async () => {
      await m("m", async (cm, um) => {
        await cm(1, []);
        await um(1, [1]);

        await cm(2, []);
        await cm(3, [2]);
        await cm(4, [3]);
        await um(2, [4]);
      });

      await m("t", async (cm) => {
        await cm(1, []);
        await cm(2, [1]);
        await cm(3, [2, 1]);
        await cm(4, [1, 2]);
      });

      await m("q", async (cm) => {
        await cm(1, []);
        await cm(2, [1]);
        await cm(3, [1]);
        await cm(4, [2, 3]);
        await cm(5, [4]);
      });

      await m("w", async (cm) => {
        await cm(1, []);
        await cm(2, [1]);
        await cm(3, [1]);
        await cm(4, [2, 3]);
        await cm(5, [4]);
        await cm(6, [1]);
        await cm(7, [5, 6]);
      });

      await m("e", async (cm, um) => {
        await cm(1, []);
        await cm(2, [1]);
        await cm(3, [1]);
        await cm(4, [2, 3]);
        await cm(5, [4]);
        await cm(6, [1]);
        await cm(7, [5, 6]);
        await um(2, [1, 5]);
      });
    });

    it("detects a trivial cycle", async () => {
      const m1 = await getModule("m-1", true);

      await expect(contract.getHtml(m1.tokenId)).to.be.revertedWith(
        "cyclic dep detected"
      );
    });

    it("detects a cycle", async () => {
      const m2 = await getModule("m-2", true);
      const m4 = await getModule("m-4", true);

      await expect(contract.getHtml(m2.tokenId)).to.be.revertedWith(
        "cyclic dep detected"
      );
      await expect(contract.getHtml(m4.tokenId)).to.be.revertedWith(
        "cyclic dep detected"
      );
    });

    it("detects a cycle 2", async () => {
      const e7 = await getModule("e-7", true);

      await expect(contract.getHtml(e7.tokenId)).to.be.revertedWith(
        "cyclic dep detected"
      );
    });

    const matchResolvedDependencies = (m, match) => {
      expect(
        m.allDependencies.map(({ name }) =>
          ethers.utils.parseBytes32String(name)
        )
      ).to.have.members(match);
    };

    it("works with non-directed cycles", async () => {
      const t3 = await getModule("t-3");
      const t4 = await getModule("t-4");

      matchResolvedDependencies(t3, ["t-1", "t-2"]);
      matchResolvedDependencies(t4, ["t-1", "t-2"]);
    });

    it("works with diamond deps", async () => {
      const q5 = await getModule("q-5");
      const w7 = await getModule("w-7");

      matchResolvedDependencies(q5, ["q-1", "q-2", "q-3", "q-4"]);
      matchResolvedDependencies(w7, ["w-1", "w-2", "w-3", "w-4", "w-5", "w-6"]);
    });
  });

  describe("auth", () => {
    const toBeRevertedOwnable = (call) =>
      expect(call).to.be.revertedWith("Ownable: caller is not the owner");

    it("can't call initialize twice", async () => {
      await expect(
        contract.initialize(
          42,
          ethers.utils.formatBytes32String("https://example.com")
        )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    describe("only ontract owner", async () => {
      it("setTemplate", async () => {
        await expect(contract.connect(owner).setTemplate("test", "test")).not.to
          .be.reverted;
        await toBeRevertedOwnable(
          contract.connect(addr1).setTemplate("test", "test")
        );
        await toBeRevertedOwnable(
          contract.connect(addr2).setTemplate("test", "test")
        );
      });

      it("setBaseURIPrefix", async () => {
        await expect(
          contract
            .connect(owner)
            .setBaseURIPrefix(
              ethers.utils.formatBytes32String("https://example.com")
            )
        ).not.to.be.reverted;
        await toBeRevertedOwnable(
          contract
            .connect(addr1)
            .setBaseURIPrefix(
              ethers.utils.formatBytes32String("https://example.com")
            )
        );
        await toBeRevertedOwnable(
          contract
            .connect(addr2)
            .setBaseURIPrefix(
              ethers.utils.formatBytes32String("https://example.com")
            )
        );
      });
    });

    describe("only token owner", () => {
      it("updateModule", async () => {
        await createModule("own-1", "test", [], "() => {}", false, addr1);
        await expect(
          updateModuleRaw("own-1", "test", [], "() => {}", false, addr1)
        ).not.to.be.reverted;
        await expect(
          updateModuleRaw("own-1", "test", [], "() => {}", false, addr2)
        ).to.be.revertedWith("only module owner can update it");
      });
      it("finalize", async () => {
        await createModule("own-2", "test", [], "() => {}", false, addr1);
        const moduleName = ethers.utils.formatBytes32String("own-2");
        await expect(
          contract.connect(addr2).finalize(moduleName)
        ).to.be.revertedWith("only module owner can change it");
        await expect(contract.connect(addr1).finalize(moduleName)).not.to.be
          .reverted;
      });
      it("setInvocable", async () => {
        await createModule("own-3", "test", [], "() => {}", true, addr1);
        const moduleName = ethers.utils.formatBytes32String("own-3");
        await expect(
          contract.connect(addr2).setInvocable(moduleName, 10, 0)
        ).to.be.revertedWith("only module owner can change it");
        await expect(contract.connect(addr1).setInvocable(moduleName, 10, 0))
          .not.to.be.reverted;
      });
    });
  });

  describe("logic", () => {
    it("finalized modules are locked", async () => {
      await createModule("final-1", "test", [], "() => {}", true);
      const moduleName = ethers.utils.formatBytes32String("final-1");
      await expect(contract.finalize(moduleName)).not.to.be.reverted;
      await expect(contract.finalize(moduleName)).to.be.revertedWith(
        "module is finalized"
      );
      await expect(contract.setInvocable(moduleName, 10, 0)).to.be.revertedWith(
        "module is finalized"
      );
      await expect(
        updateModule("final-1", "test", [], "() => {}", true)
      ).to.be.revertedWith("module is finalized");
    });

    it("invocations work correctly", async () => {
      await createModule("mint-1", "test", [], "() => {}", true, owner);
      const moduleName1 = ethers.utils.formatBytes32String("mint-1");
      await createModule("mint-2", "test", [], "() => {}", false, addr2);
      const moduleName2 = ethers.utils.formatBytes32String("mint-2");

      await expect(contract.connect(owner).setLambdaInvocationFee(10)).not.to.be
        .reverted;
      await expect(contract.connect(owner).setLambdaWallet(addr1.address)).not
        .to.be.reverted;

      await expect(contract.createInvocation(moduleName1)).to.be.revertedWith(
        "module must be finalized"
      );
      await expect(contract.createInvocation(moduleName2)).to.be.revertedWith(
        "module must be invocable"
      );

      await expect(contract.finalize(moduleName1)).not.to.be.reverted;
      await expect(contract.createInvocation(moduleName1)).to.be.revertedWith(
        "invocations limit reached"
      );

      await updateModule("mint-2", "test", [], "() => {}", true, addr2);
      await expect(contract.connect(addr2).setInvocable(moduleName2, 1, 12300))
        .not.to.be.reverted;
      await expect(
        contract.createInvocation(moduleName2, { value: 9 })
      ).to.be.revertedWith("Insufficient fee");

      const ownerBalanceBefore = await owner.getBalance();
      const creatorBalanceBefore = await addr2.getBalance();
      const lambdaBalanceBefore = await addr1.getBalance();

      await expect(
        contract
          .connect(owner)
          .createInvocation(moduleName2, { value: 20000, gasPrice: 0 })
      ).not.to.be.reverted;

      expect(
        (await addr1.getBalance()).sub(lambdaBalanceBefore).toNumber()
      ).to.equal(1230);

      expect(
        (await addr2.getBalance()).sub(creatorBalanceBefore).toNumber()
      ).to.equal(11070);

      expect(
        (await owner.getBalance()).sub(ownerBalanceBefore).toNumber()
      ).to.equal(-12300);

      await expect(
        contract.createInvocation(moduleName2, { value: 12300 })
      ).to.be.revertedWith("invocations limit reached");
    });
  });
});
