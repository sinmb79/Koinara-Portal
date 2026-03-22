import { create } from "zustand"
import { ethers } from "ethers"
import { WORLDLAND, BASE, SUPPORTED_CHAINS, JOB_TYPE_OPTIONS, epochAt } from "./chain.js"
import { FEE_CONFIG, calcRequesterFee } from "./feeConfig.js"
import { summarizeMissionRewards } from "./missionParticipation.js"
import { discoverInjectedWallets, listInjectedWallets, requireInjectedWallet } from "./wallet.js"
import {
  ADDRESSES,
  AGENT_REGISTRY_ABI,
  TIMELOCK_ABI,
  KOIN_ABI,
  NODE_STAKING_ABI,
  NODE_REGISTRY_ABI,
  REGISTRY_ABI,
  VERIFIER_ABI,
  DISTRIBUTOR_ABI,
} from "../abi/index.js"

const PORTAL_FEE_STORAGE_KEY = "koinara_portal_fee_jobs"

function formatToken(value, digits = 4) {
  try {
    return Number(ethers.formatEther(value ?? 0n)).toFixed(digits)
  } catch {
    return "0.0000"
  }
}

function toBigInt(value) {
  try {
    return BigInt(value ?? 0)
  } catch {
    return 0n
  }
}

function hasVerifierRecord(record) {
  if (!record) return false
  return (
    Boolean(record.validJob) ||
    Boolean(record.finalized) ||
    Boolean(record.rejected) ||
    Number(record.approvals ?? 0) > 0 ||
    Number(record.quorum ?? 0) > 0 ||
    Number(record.submittedAt ?? 0) > 0
  )
}

function readPortalFeeMetadata() {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(PORTAL_FEE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writePortalFeeMetadata(value) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(PORTAL_FEE_STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Ignore localStorage write failures.
  }
}

function hasConfiguredContract(address) {
  return Boolean(address) && address !== ethers.ZeroAddress
}

function buildContracts(runner) {
  return {
    timelock: new ethers.Contract(ADDRESSES.timelock, TIMELOCK_ABI, runner),
    koin: new ethers.Contract(ADDRESSES.koin, KOIN_ABI, runner),
    missionKoin: new ethers.Contract(ADDRESSES.missionKoin, KOIN_ABI, runner),
    agentRegistry: hasConfiguredContract(ADDRESSES.agentRegistry)
      ? new ethers.Contract(ADDRESSES.agentRegistry, AGENT_REGISTRY_ABI, runner)
      : null,
    nodeStaking: new ethers.Contract(ADDRESSES.nodeStaking, NODE_STAKING_ABI, runner),
    nodeReg: new ethers.Contract(ADDRESSES.nodeReg, NODE_REGISTRY_ABI, runner),
    registry: new ethers.Contract(ADDRESSES.registry, REGISTRY_ABI, runner),
    verifier: new ethers.Contract(ADDRESSES.verifier, VERIFIER_ABI, runner),
    distributor: new ethers.Contract(ADDRESSES.distributor, DISTRIBUTOR_ABI, runner),
  }
}

const INITIAL_DASHBOARD = {
  wlcBalance: "0.0000",
  koinBalance: "0.00",
  bondAmount: "0.0000",
  pendingActiveRewards: "0.00",
  pendingMissionRewards: "0.00",
  pendingVerificationRewards: "0.00",
  pendingWorkRewards: "0.00",
  currentEpoch: 0,
  minBond: "0.0000",
  activeNodeCount: 0,
  totalJobs: 0,
  bondStatus: "none",
  bondReadyAt: null,
  bondReleasePeriodDays: 7,
  nodeRegistered: false,
  nodeRole: null,
  nodeLastHeartbeatEpoch: null,
  nodeMetadataHash: null,
  timelockDelay: "0",
}

const INITIAL_AGENT_IDENTITY = {
  available: hasConfiguredContract(ADDRESSES.agentRegistry),
  registered: false,
  identityRef: null,
  metadataURI: "",
  owner: null,
  pendingOwner: null,
  relinkNonce: 0,
}

const useStore = create((set, get) => ({
  lang: localStorage.getItem("koinara_lang") || "en",
  setLang: (lang) => {
    localStorage.setItem("koinara_lang", lang)
    set({ lang })
  },

  address: null,
  chainId: null,
  isConnecting: false,
  isCorrectChain: false,
  readProvider: null,
  provider: null,
  signer: null,
  walletProvider: null,
  walletId: null,
  walletName: null,
  readContracts: null,
  contracts: null,
  dashboard: { ...INITIAL_DASHBOARD },
  agentIdentity: { ...INITIAL_AGENT_IDENTITY },
  jobs: [],
  rewardHistory: [],
  workRewards: [],
  isLoadingJobs: false,
  isLoadingDashboard: false,
  isLoadingRewards: false,
  lastError: null,

  initReadOnly: async () => {
    try {
      const readProvider = new ethers.JsonRpcProvider(WORLDLAND.rpcUrls[0], WORLDLAND.chainId)
      set({ readProvider, readContracts: buildContracts(readProvider) })
    } catch (error) {
      set({ lastError: error.message })
    }
  },

  connect: async (walletId = null) => {
    set({ isConnecting: true })
    try {
      const wallets = await discoverInjectedWallets()
      const selected = requireInjectedWallet(walletId, wallets)
      const provider = new ethers.BrowserProvider(selected.provider)
      const accounts = await selected.provider.request({ method: "eth_requestAccounts", params: [] })
      if (!Array.isArray(accounts) || accounts.length === 0) {
        throw new Error("The selected wallet has no available account.")
      }
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()
      const chainId = Number(network.chainId)
      const isCorrectChain = chainId === WORLDLAND.chainId || chainId === BASE.chainId
      set({
        provider,
        signer,
        walletProvider: selected.provider,
        walletId: selected.id,
        walletName: selected.name,
        address,
        chainId,
        isCorrectChain,
        contracts: buildContracts(signer),
        isConnecting: false,
      })
      await Promise.allSettled([get().refreshDashboard(), get().loadJobs(), get().loadRewards(), get().loadAgentIdentity()])
    } catch (error) {
      set({ isConnecting: false, lastError: error.message })
      throw error
    }
  },

  disconnect: () =>
    set({
      address: null,
      chainId: null,
      isCorrectChain: false,
      provider: null,
      signer: null,
      walletProvider: null,
      walletId: null,
      walletName: null,
      contracts: null,
      dashboard: { ...INITIAL_DASHBOARD },
      agentIdentity: { ...INITIAL_AGENT_IDENTITY },
      rewardHistory: [],
      workRewards: [],
    }),

  switchChain: async (targetChain = null) => {
    const chain = targetChain || WORLDLAND
    const wallets = listInjectedWallets()
    const injected = get().walletProvider || requireInjectedWallet(wallets[0]?.id, wallets).provider
    try {
      await injected.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chain.chainIdHex }],
      })
    } catch (error) {
      if (error.code === 4902) {
        await injected.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: chain.chainIdHex,
            chainName: chain.chainName,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: chain.rpcUrls,
            blockExplorerUrls: chain.blockExplorerUrls,
          }],
        })
      } else {
        throw error
      }
    }
    // Update chainId after switch
    const provider = get().provider
    if (provider) {
      const network = await provider.getNetwork()
      const newChainId = Number(network.chainId)
      set({ chainId: newChainId, isCorrectChain: newChainId === WORLDLAND.chainId || newChainId === BASE.chainId })
    }
  },

  refreshDashboard: async () => {
    const { readContracts, provider, contracts, address } = get()
    if (!readContracts) return
    set({ isLoadingDashboard: true })
    try {
      const base = await Promise.all([
        readContracts.distributor.currentEpoch(),
        readContracts.nodeStaking.minBond(),
        readContracts.registry.totalJobs(),
        readContracts.timelock.delay(),
      ])

      const currentEpoch = Number(base[0])
      const minBond = base[1]
      const totalJobs = Number(base[2])
      const timelockDelay = String(base[3])
      const activeNodeCount = Number(await readContracts.nodeReg.activeNodeCount(currentEpoch))

      const dashboard = {
        ...INITIAL_DASHBOARD,
        currentEpoch,
        minBond: formatToken(minBond),
        totalJobs,
        activeNodeCount,
        timelockDelay,
      }

      if (address && provider && contracts) {
        const [wlcBalance, missionKoinBalance, stake, node, genesisTimestamp, epochDuration] = await Promise.all([
          provider.getBalance(address),
          readContracts.missionKoin.balanceOf(address),
          readContracts.nodeStaking.getStake(address),
          readContracts.nodeReg.getNode(address),
          readContracts.nodeStaking.genesisTimestamp(),
          readContracts.nodeStaking.epochDuration(),
        ])

        let bondStatus = "none"
        let bondReadyAt = null
        const stakeAmount = toBigInt(stake.amount)
        const unstakeRequestedAt = Number(stake.unstakeRequestedAt)

        if (stake.active && stakeAmount > 0n) {
          bondStatus = unstakeRequestedAt > 0 ? "pending" : "active"
        } else if (stakeAmount > 0n) {
          bondStatus = "pending"
        }

        if (unstakeRequestedAt > 0) {
          const cooldownEndEpoch = epochAt(
            unstakeRequestedAt,
            Number(genesisTimestamp),
            Number(epochDuration),
          ) + 7
          bondReadyAt = Number(genesisTimestamp) + cooldownEndEpoch * Number(epochDuration)
        }

        dashboard.wlcBalance = formatToken(wlcBalance)
        dashboard.koinBalance = formatToken(missionKoinBalance, 2)
        dashboard.bondAmount = formatToken(stakeAmount)
        dashboard.bondStatus = bondStatus
        dashboard.bondReadyAt = bondReadyAt
        dashboard.nodeRegistered = Number(node.registeredAt) > 0
        dashboard.nodeRole = Number(node.role)
        dashboard.nodeLastHeartbeatEpoch = Number(node.lastHeartbeatEpoch)
        dashboard.nodeMetadataHash = node.metadataHash
      }

      set({ dashboard, isLoadingDashboard: false })
    } catch (error) {
      set({ isLoadingDashboard: false, lastError: error.message })
    }
  },

  loadAgentIdentity: async () => {
    const { address, readContracts } = get()
    if (!address) {
      set({ agentIdentity: { ...INITIAL_AGENT_IDENTITY } })
      return
    }

    if (!readContracts?.agentRegistry) {
      set({
        agentIdentity: {
          ...INITIAL_AGENT_IDENTITY,
          available: false,
          owner: address,
        },
      })
      return
    }

    try {
      const agent = await readContracts.agentRegistry.getAgent(address)
      set({
        agentIdentity: {
          available: true,
          registered: Boolean(agent.registered),
          identityRef: agent.registered ? agent.identityRef : null,
          metadataURI: agent.metadataURI || "",
          owner: agent.registered ? agent.owner : address,
          pendingOwner: agent.pendingOwner === ethers.ZeroAddress ? null : agent.pendingOwner,
          relinkNonce: Number(agent.relinkNonce || 0),
        },
      })
    } catch (error) {
      set({
        agentIdentity: {
          ...INITIAL_AGENT_IDENTITY,
          available: true,
          owner: address,
        },
        lastError: error.message,
      })
    }
  },

  lookupAgentIdentityOwner: async (identityRef) => {
    const { readContracts } = get()
    if (!identityRef || !readContracts?.agentRegistry) {
      return null
    }

    const owner = await readContracts.agentRegistry.getOwnerForIdentity(identityRef)
    return owner === ethers.ZeroAddress ? null : owner
  },

  loadJobs: async (limit = 20) => {
    const { readContracts } = get()
    if (!readContracts) return
    set({ isLoadingJobs: true })
    try {
      const totalJobs = Number(await readContracts.registry.totalJobs())
      const maxId = Math.max(totalJobs, 0)
      const ids = Array.from({ length: Math.min(limit, maxId) }, (_, index) => maxId - index).filter(Boolean)
      const portalFeeMetadata = readPortalFeeMetadata()
      const jobs = await Promise.all(
        ids.map(async (jobId) => {
          const [job, submission, verifierRecord] = await Promise.all([
            readContracts.registry.getJob(jobId),
            readContracts.registry.getSubmission(jobId).catch(() => null),
            readContracts.verifier.getRecord(jobId).catch(() => null),
          ])
          let recorded = null
          let rewardBreakdown = null
          let approvedVerifiers = []
          try {
            recorded = await readContracts.distributor.getRecordedJob(jobId)
            rewardBreakdown = await readContracts.distributor.getRewardBreakdown(jobId)
          } catch {}
          if (hasVerifierRecord(verifierRecord)) {
            try {
              approvedVerifiers = await readContracts.verifier.getApprovedVerifiers(jobId)
            } catch {}
          }

          return {
            id: Number(job.jobId),
            creator: job.creator,
            requestHash: job.requestHash,
            schemaHash: job.schemaHash,
            deadline: Number(job.deadline),
            jobType: Number(job.jobType),
            premiumReward: job.premiumReward,
            state: Number(job.state),
            submission: submission?.exists
              ? {
                  provider: submission.provider,
                  responseHash: submission.responseHash,
                  submittedAt: Number(submission.submittedAt),
                }
              : null,
            verifierRecord: hasVerifierRecord(verifierRecord)
              ? {
                  provider: verifierRecord.provider,
                  responseHash: verifierRecord.responseHash,
                  submittedAt: Number(verifierRecord.submittedAt),
                  finalizedAt: Number(verifierRecord.finalizedAt),
                  approvals: Number(verifierRecord.approvals),
                  quorum: Number(verifierRecord.quorum),
                  validJob: verifierRecord.validJob,
                  withinDeadline: verifierRecord.withinDeadline,
                  formatPass: verifierRecord.formatPass,
                  nonEmptyResponse: verifierRecord.nonEmptyResponse,
                  verificationPass: verifierRecord.verificationPass,
                  rejected: verifierRecord.rejected,
                  finalized: verifierRecord.finalized,
                  poiHash: verifierRecord.poiHash,
                }
              : null,
            approvedVerifiers,
            recorded: recorded?.exists
              ? {
                  provider: recorded.provider,
                  epoch: Number(recorded.epoch),
                  weight: Number(recorded.weight),
                  verifierCount: Number(recorded.verifierCount),
                  providerClaimed: recorded.providerClaimed,
                }
              : null,
            rewardBreakdown: rewardBreakdown
              ? {
                  totalReward: rewardBreakdown.totalReward,
                  providerReward: rewardBreakdown.providerReward,
                  verifierRewardTotal: rewardBreakdown.verifierRewardTotal,
                }
              : null,
            portalFee: portalFeeMetadata[String(jobId)] || null,
          }
        }),
      )
      set({ jobs, isLoadingJobs: false })
    } catch (error) {
      set({ isLoadingJobs: false, lastError: error.message })
    }
  },

  loadRewards: async () => {
    const { address, readContracts, dashboard, jobs } = get()
    if (!address || !readContracts) return
    set({ isLoadingRewards: true })
    try {
      const lookback = 8
      const lastClosedEpoch = Math.max(0, dashboard.currentEpoch - 1)
      const epochs = Array.from({ length: Math.min(lookback, lastClosedEpoch + 1) }, (_, index) => lastClosedEpoch - index)

      const rewardHistory = await Promise.all(
        epochs.map(async (epoch) => {
          const [activeNodes, emission, claimed, activeAt, addressWeight, totalWeight] = await Promise.all([
            readContracts.nodeReg.activeNodeCount(epoch),
            readContracts.distributor.activeEpochEmission(epoch),
            readContracts.distributor.activeRewardClaimed(epoch, address),
            readContracts.nodeReg.isNodeActiveAt(address, epoch),
            readContracts.distributor.epochAddressWeight(epoch, address),
            readContracts.distributor.epochAcceptedWeight(epoch),
          ])
          const estimatedActiveReward = activeAt && activeNodes > 0n ? emission / activeNodes : 0n
          return {
            epoch,
            activeNodes: Number(activeNodes),
            claimed,
            activeAt,
            addressWeight: Number(addressWeight),
            totalWeight: Number(totalWeight),
            estimatedActiveReward,
          }
        }),
      )

      const workRewards = []
      for (const job of jobs) {
        if (!job.recorded || !job.rewardBreakdown) continue
        if (job.recorded.provider?.toLowerCase() === address.toLowerCase() && !job.recorded.providerClaimed) {
          workRewards.push({
            jobId: job.id,
            role: "provider",
            source: "mission",
            amount: job.rewardBreakdown.providerReward,
          })
        }
        try {
          const approved = await readContracts.verifier.getApprovedVerifiers(job.id)
          if (approved.some((item) => item.toLowerCase() === address.toLowerCase())) {
            const alreadyClaimed = await readContracts.distributor.verifierRewardClaimed(job.id, address)
            if (!alreadyClaimed && job.recorded.verifierCount > 0) {
              workRewards.push({
                jobId: job.id,
                role: "verifier",
                source: "verification",
                amount: job.rewardBreakdown.verifierRewardTotal / BigInt(job.recorded.verifierCount),
              })
            }
          }
        } catch {}
      }

      const rewardSummary = summarizeMissionRewards(workRewards)
      const pendingActiveRewards = rewardHistory
        .filter((item) => item.activeAt && !item.claimed)
        .reduce((acc, item) => acc + item.estimatedActiveReward, 0n)
      const pendingWorkRewards = rewardSummary.missionTotal + rewardSummary.verificationTotal

      set((state) => ({
        rewardHistory,
        workRewards,
        isLoadingRewards: false,
        dashboard: {
          ...state.dashboard,
          pendingActiveRewards: formatToken(pendingActiveRewards, 2),
          pendingMissionRewards: formatToken(rewardSummary.missionTotal, 2),
          pendingVerificationRewards: formatToken(rewardSummary.verificationTotal, 2),
          pendingWorkRewards: formatToken(pendingWorkRewards, 2),
        },
      }))
    } catch (error) {
      set({ isLoadingRewards: false, lastError: error.message })
    }
  },

  postBond: async () => {
    const { contracts } = get()
    if (!contracts) throw new Error("Wallet not connected.")
    const minBond = await contracts.nodeStaking.minBond()
    const tx = await contracts.nodeStaking.stake({ value: minBond })
    await tx.wait()
    await Promise.allSettled([get().refreshDashboard(), get().loadRewards()])
    return tx.hash
  },

  requestBondRelease: async () => {
    const { contracts } = get()
    if (!contracts) throw new Error("Wallet not connected.")
    const tx = await contracts.nodeStaking.requestUnstake()
    await tx.wait()
    await get().refreshDashboard()
    return tx.hash
  },

  withdrawBond: async () => {
    const { contracts } = get()
    if (!contracts) throw new Error("Wallet not connected.")
    const tx = await contracts.nodeStaking.completeUnstake()
    await tx.wait()
    await get().refreshDashboard()
    return tx.hash
  },

  registerNode: async ({ role, metadata }) => {
    const { contracts } = get()
    if (!contracts) throw new Error("Wallet not connected.")
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes((metadata || "koinara-node").trim()))
    const tx = await contracts.nodeReg.registerNode(role, metadataHash)
    await tx.wait()
    await get().refreshDashboard()
    return tx.hash
  },

  createJob: async ({ requestText, schemaText, jobType, deadlineHours, premiumWlc, onProgress }) => {
    const { contracts, signer, address } = get()
    if (!contracts) throw new Error("Wallet not connected.")
    if (!signer) throw new Error("Signer not available.")
    const requestHash = ethers.keccak256(ethers.toUtf8Bytes(requestText.trim()))
    const schemaHash = ethers.keccak256(ethers.toUtf8Bytes((schemaText || "text/plain").trim()))
    const deadline = Math.floor(Date.now() / 1000) + Number(deadlineHours || 24) * 3600
    const premium = ethers.parseEther(String(premiumWlc || "0"))
    const { fee, total, currentPhase } = calcRequesterFee(premium)

    let feeTxHash = null
    if (fee > 0n) {
      onProgress?.("fee")
      const feeTx = await signer.sendTransaction({
        to: FEE_CONFIG.feeWallet,
        value: fee,
      })
      const feeReceipt = await feeTx.wait()
      feeTxHash = feeReceipt.hash
    }

    let receipt
    try {
      onProgress?.("create")
      const tx = await contracts.registry.createJob(requestHash, schemaHash, deadline, jobType, { value: premium })
      receipt = await tx.wait()
    } catch (error) {
      if (feeTxHash) {
        error.portalFeeSent = true
        error.feeTxHash = feeTxHash
        error.feeAmount = fee
      }
      throw error
    }

    let jobId = null
    for (const log of receipt.logs) {
      try {
        const parsed = contracts.registry.interface.parseLog(log)
        if (parsed?.name === "JobCreated") {
          jobId = Number(parsed.args.jobId)
        }
      } catch {}
    }

    if (jobId != null) {
      const currentMetadata = readPortalFeeMetadata()
      currentMetadata[String(jobId)] = {
        feeWei: fee.toString(),
        premiumWei: premium.toString(),
        totalWei: total.toString(),
        feeTxHash,
        requesterBps: currentPhase.requesterBps,
        phaseName: currentPhase.name,
        creator: address,
        capturedAt: new Date().toISOString(),
      }
      writePortalFeeMetadata(currentMetadata)
    }

    await Promise.allSettled([get().refreshDashboard(), get().loadJobs()])
    return {
      hash: receipt.hash,
      jobId,
      feeTxHash,
      feeAmountWei: fee.toString(),
      premiumWei: premium.toString(),
      totalWei: total.toString(),
      promoPhase: currentPhase.name,
    }
  },

  claimActiveReward: async (epoch) => {
    const { contracts } = get()
    if (!contracts) throw new Error("Wallet not connected.")
    const tx = await contracts.distributor.claimActiveReward(epoch)
    await tx.wait()
    await Promise.allSettled([get().refreshDashboard(), get().loadRewards()])
    return tx.hash
  },

  claimWorkReward: async (jobId, role) => {
    const { contracts } = get()
    if (!contracts) throw new Error("Wallet not connected.")
    const tx =
      role === "provider"
        ? await contracts.distributor.claimProviderWorkReward(jobId)
        : await contracts.distributor.claimVerifierWorkReward(jobId)
    await tx.wait()
    await Promise.allSettled([get().refreshDashboard(), get().loadRewards(), get().loadJobs()])
    return tx.hash
  },

  registerAgentIdentity: async ({ identityRef, metadataURI = "" }) => {
    const { contracts } = get()
    if (!contracts?.agentRegistry) {
      throw new Error("Agent ID registry is not configured yet.")
    }

    const tx = await contracts.agentRegistry.registerAgent(identityRef, metadataURI)
    await tx.wait()
    await get().loadAgentIdentity()
    return tx.hash
  },

  requestAgentIdentityRelink: async (newOwner) => {
    const { contracts } = get()
    if (!contracts?.agentRegistry) {
      throw new Error("Agent ID registry is not configured yet.")
    }

    const tx = await contracts.agentRegistry.requestRelink(newOwner)
    await tx.wait()
    await get().loadAgentIdentity()
    return tx.hash
  },
}))

export default useStore
