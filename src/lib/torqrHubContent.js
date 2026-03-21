export const TORQR_HUB_COPY = {
  gateTitle: "Restricted Jurisdictions",
  createButton: "Create Token",
  connectWallet: "Connect Wallet",
  guideButton: "Guide",
  legalBadge: "Legal Notice",
  enterApp: "Enter App",
  accessRestricted: "Access Restricted",
  termsTitle: "Terms of Use & Disclaimer",
  guideTitle: "How Torqr Works",
}

export const TORQR_GUIDE_SECTIONS = [
  {
    title: "Core Fees",
    body:
      "Launching a token costs a fixed 1 WLC creation fee. Trading on the bonding curve charges a 1% trading fee on both buys and sells.",
  },
  {
    title: "Token Split",
    body:
      "Each token launches with 1,000,000,000 total supply. 80% goes to the bonding curve for public price discovery, and the 20% creator allocation is vested.",
  },
  {
    title: "Bonding Curve Buys",
    body:
      "There is no permanent flat buy amount. The minimum WLC needed changes live with curve state, and the app now shows the current minimum buy before you submit.",
  },
  {
    title: "Graduation To AMM",
    body:
      "A token graduates when the bonding curve reserve reaches 10 WLC reserve. At that point the accumulated WLC plus the remaining curve tokens are used to seed the AMM automatically.",
  },
  {
    title: "AMM Trading",
    body:
      "After graduation, price comes from pool reserves instead of the bonding curve. There is no single fixed WLC amount required for AMM trades because output depends on live liquidity and slippage.",
  },
]
