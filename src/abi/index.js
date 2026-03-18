// Public-safe addresses sourced from:
// C:\Users\sinmb\koinara\worldland\deployments\worldland-mainnet-v3.public.json
export const ADDRESSES = {
  timelock: "0xa8894C6BeD298ddBbE95312d5BE90eeE65D876Af",
  koin: "0x029F7EfE08F37d987c2eDeD3de4Ba4a2b9BA422B",
  nodeStaking: "0x5CC441eAd4dA5A2ABF41e0c169b5cF28D3F81fBC",
  nodeReg: "0xe29ce58501bc13fDFa2937efe63f52FF1eee1725",
  registry: "0x7518B1B76dA0eb61f79db76671A99f404eBB6960",
  verifier: "0xb484695F28382E9960d37728Aa724777FC252149",
  distributor: "0x7E0185DF566269906711ada358cD816394e20447",
  // Mission Board contracts (Worldland Mainnet)
  missionBoard: "0xBEeC6567e8eCB6a5D919F15312a8cAB73e3Bef55",
  collaborationManager: "0xBC2939f67142946331e5c2Bbb04CCC2AAe432CE4",
  verificationOracle: "0x28c3e8F3b441C3a1a797b39E5B4d8F9EFF4eF901",
  missionKoin: "0x1d22f43A5105C9dc540DbC9F9d94E0CA4bF0Ec08",
}

export const NODE_ROLE = {
  PROVIDER: 0,
  VERIFIER: 1,
  BOTH: 2,
}

export const JOB_TYPE = {
  SIMPLE: 0,
  GENERAL: 1,
  COLLECTIVE: 2,
}

export const JOB_STATE = {
  CREATED: 0,
  OPEN: 1,
  SUBMITTED: 2,
  UNDER_VERIFICATION: 3,
  ACCEPTED: 4,
  REJECTED: 5,
  SETTLED: 6,
  EXPIRED: 7,
}

export const TIMELOCK_ABI = [
  "function admin() view returns (address)",
  "function pendingAdmin() view returns (address)",
  "function delay() view returns (uint256)",
  "function guardian() view returns (address)",
]

export const KOIN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
]

export const NODE_STAKING_ABI = [
  "function stake() payable",
  "function requestUnstake()",
  "function completeUnstake()",
  "function cancelUnstake()",
  "function isStaked(address node) view returns (bool)",
  "function getStake(address node) view returns ((uint256 amount, uint64 stakedAt, uint64 unstakeRequestedAt, bool active))",
  "function minBond() view returns (uint256)",
  "function genesisTimestamp() view returns (uint256)",
  "function epochDuration() view returns (uint256)",
  "function admin() view returns (address)",
  "function paused() view returns (bool)",
]

export const NODE_REGISTRY_ABI = [
  "function registerNode(uint8 role, bytes32 metadataHash)",
  "function setNodeMetadata(bytes32 metadataHash)",
  "function heartbeat() returns (uint256)",
  "function deactivateNode()",
  "function getNode(address node) view returns ((uint8 role, bytes32 metadataHash, uint64 registeredAt, uint64 lastHeartbeatEpoch, bool active))",
  "function isNodeActiveAt(address node, uint256 epoch) view returns (bool)",
  "function activeNodeCount(uint256 epoch) view returns (uint256)",
  "function currentEpoch() view returns (uint256)",
  "function epochDuration() view returns (uint256)",
  "function genesisTimestamp() view returns (uint256)",
  "function rewardDistributor() view returns (address)",
  "function admin() view returns (address)",
  "function paused() view returns (bool)",
]

export const REGISTRY_ABI = [
  "function totalJobs() view returns (uint256)",
  "function createJob(bytes32 requestHash, bytes32 schemaHash, uint64 deadline, uint8 jobType) payable returns (uint256)",
  "function submitResponse(uint256 jobId, bytes32 responseHash)",
  "function getJob(uint256 jobId) view returns ((uint256 jobId, address creator, bytes32 requestHash, bytes32 schemaHash, uint64 deadline, uint8 jobType, uint256 premiumReward, uint8 state))",
  "function getSubmission(uint256 jobId) view returns ((address provider, bytes32 responseHash, uint64 submittedAt, bool exists))",
  "function verifier() view returns (address)",
  "function rewardDistributor() view returns (address)",
  "function admin() view returns (address)",
  "function paused() view returns (bool)",
  "event JobCreated(uint256 indexed jobId, address indexed creator, bytes32 requestHash, bytes32 schemaHash, uint64 deadline, uint8 jobType, uint256 premiumReward)",
]

export const VERIFIER_ABI = [
  "function registerSubmission(uint256 jobId)",
  "function verifySubmission(uint256 jobId)",
  "function rejectSubmission(uint256 jobId, string calldata reason)",
  "function finalizePoI(uint256 jobId) returns (bytes32)",
  "function getRecord(uint256 jobId) view returns ((address provider, bytes32 responseHash, uint64 submittedAt, uint64 finalizedAt, uint32 approvals, uint32 quorum, bool validJob, bool withinDeadline, bool formatPass, bool nonEmptyResponse, bool verificationPass, bool rejected, bool finalized, bytes32 poiHash))",
  "function getApprovedVerifiers(uint256 jobId) view returns (address[])",
  "function maxVerificationWindow() view returns (uint256)",
  "function paused() view returns (bool)",
]

// ── Mission Board ABIs ─────────────────────────────
export const MISSION_BOARD_ABI = [
  "function getMissionCount() view returns (uint256)",
  "function getMission(uint256 missionId) view returns ((uint256 id, uint8 category, string metadataURI, address curator, uint256 baseReward, uint256 progressReward, uint256 resolutionReward, uint8 status, uint256 createdAt, uint256 claimedAt))",
  "function getSubmissionsByMission(uint256 missionId) view returns (uint256[])",
  "function getSubmission(uint256 submissionId) view returns ((uint256 id, uint256 missionId, address submitter, string reportHash, bytes proofData, uint8 verdict, bool isResolution, bool verified, uint256 submittedAt))",
  "function isParticipant(uint256 missionId, address account) view returns (bool)",
  "function getParticipants(uint256 missionId) view returns (address[])",
  "function claimMission(uint256 missionId, bytes calldata ailCredential)",
  "function submitProgress(uint256 missionId, string calldata reportHash, bytes calldata proofData) returns (uint256)",
  "function submitResolution(uint256 missionId, string calldata reportHash, bytes calldata proofData) returns (uint256)",
  "event MissionRegistered(uint256 indexed missionId, uint8 category, address indexed curator, uint256 baseReward, uint256 progressReward, uint256 resolutionReward)",
  "event MissionClaimed(uint256 indexed missionId, address indexed claimer, bytes32 ailId)",
  "event ProgressSubmitted(uint256 indexed missionId, uint256 indexed submissionId, address indexed submitter, string reportHash)",
  "event ResolutionSubmitted(uint256 indexed missionId, uint256 indexed submissionId, address indexed submitter, string reportHash)",
]

export const COLLABORATION_MANAGER_ABI = [
  "function getTeam(uint256 missionId) view returns ((uint256 missionId, address[] agents, address[] humans, uint256[] rewardShares, bool exists))",
  "function hasTeam(uint256 missionId) view returns (bool)",
  "function formTeam(uint256 missionId, address[] calldata agents, address[] calldata humans, uint256[] calldata rewardShares)",
]

export const MISSION_CATEGORY = { COLD_CASE: 0, MATH: 1, RESEARCH: 2 }
export const MISSION_STATUS = { OPEN: 0, IN_PROGRESS: 1, UNDER_REVIEW: 2, RESOLVED: 3, CLOSED: 4 }
export const VERDICT = { VERIFIED: 0, PROGRESS: 1, INCONCLUSIVE: 2, REJECTED: 3 }

export const DISTRIBUTOR_ABI = [
  "function currentEpoch() view returns (uint256)",
  "function activeEpochEmission(uint256 epoch) view returns (uint256)",
  "function activePoolBps() view returns (uint256)",
  "function epochAddressWeight(uint256 epoch, address node) view returns (uint256)",
  "function epochAcceptedWeight(uint256 epoch) view returns (uint256)",
  "function activeRewardClaimed(uint256 epoch, address node) view returns (bool)",
  "function activeRewardLookback() view returns (uint256)",
  "function claimActiveReward(uint256 epoch)",
  "function claimProviderWorkReward(uint256 jobId)",
  "function claimVerifierWorkReward(uint256 jobId)",
  "function verifierRewardClaimed(uint256 jobId, address verifier) view returns (bool)",
  "function getRewardBreakdown(uint256 jobId) view returns (uint256 totalReward, uint256 providerReward, uint256 verifierRewardTotal)",
  "function getRecordedJob(uint256 jobId) view returns ((address provider, uint64 epoch, uint32 weight, uint32 verifierCount, bool exists, bool providerClaimed))",
  "function maxWeightPerAddressPerEpoch() view returns (uint256)",
  "function admin() view returns (address)",
  "function paused() view returns (bool)",
]
