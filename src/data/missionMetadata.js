/**
 * Mission metadata — descriptions, references, and display info
 * Keyed by metadataURI (on-chain identifier)
 *
 * NOTE: Mission #9 (Hwaseong) is marked closed because the case was solved in 2019.
 */

const MISSION_METADATA = {
  // ═══════════════════════════════════════════════════════════════
  //  COLD CASES
  // ═══════════════════════════════════════════════════════════════

  "ipfs://QmColdCase001": {
    title: "D.B. Cooper Hijacking (1971)",
    description:
      "On November 24, 1971, an unidentified man hijacked a Northwest Orient Boeing 727, collected $200,000 ransom, and parachuted into the Pacific Northwest wilderness. Despite one of the longest and most exhaustive FBI investigations in history, no confirmed suspect has ever been identified. Some ransom bills were found along the Columbia River in 1980, but Cooper's fate remains unknown.",
    difficulty: "Extreme",
    year: 1971,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/D._B._Cooper" },
      { label: "FBI Vault", url: "https://vault.fbi.gov/D-B-Cooper" },
    ],
  },

  "ipfs://QmColdCase002": {
    title: "Zodiac Killer — Unsolved Identity",
    description:
      "The Zodiac Killer murdered at least five people in Northern California between 1968 and 1969, taunting police with cryptic letters and ciphers. The Z340 cipher was finally decoded in December 2020 by amateur cryptographers, but the killer's identity remains unknown. Over 2,500 suspects have been investigated without conclusive identification.",
    difficulty: "Extreme",
    year: 1968,
    note: "Z340 cipher decoded in 2020; killer identity still unknown",
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Zodiac_Killer" },
      { label: "FBI", url: "https://www.fbi.gov/history/famous-cases/zodiac-killer" },
    ],
  },

  "ipfs://QmJackTheRipper1888": {
    title: "Jack the Ripper — Identity Analysis (1888)",
    description:
      "In autumn 1888, at least five women were brutally murdered in London's Whitechapel district. Despite being one of the most investigated cases in criminal history, the killer's identity has never been conclusively established. DNA analysis in 2019 suggested Aaron Kosminski as a suspect, but the methodology has been disputed. Over 100 suspects have been proposed across 137 years of investigation.",
    difficulty: "Extreme",
    year: 1888,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Jack_the_Ripper" },
      { label: "Casebook", url: "https://www.casebook.org" },
    ],
  },

  "ipfs://QmTamamShud1948": {
    title: "Tamam Shud Case — Somerton Man (1948)",
    description:
      "On December 1, 1948, an unidentified man was found dead on Somerton Beach, Adelaide, Australia. A scrap of paper reading 'Tamam Shud' (meaning 'ended' in Persian) was sewn into his pocket, linked to a copy of the Rubaiyat of Omar Khayyam. DNA analysis in 2022 identified him as Carl Webb, an electrical engineer from Melbourne, but his cause of death and the meaning of a coded message found nearby remain unsolved.",
    difficulty: "High",
    year: 1948,
    note: "Identity confirmed as Carl Webb in 2022; cause of death and cipher still unsolved",
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Tamam_Shud_case" },
      { label: "ABC Australia", url: "https://www.abc.net.au/news/2022-07-26/somerton-man-identified/101272182" },
    ],
  },

  "ipfs://QmBlackDahlia1947": {
    title: "Black Dahlia Murder — Elizabeth Short (1947)",
    description:
      "On January 15, 1947, the bisected body of 22-year-old Elizabeth Short was found in a vacant lot in Los Angeles. The murder, characterized by the surgical precision of the bisection and lack of blood at the scene, became one of the most infamous unsolved cases in American history. Over 150 suspects were investigated by the LAPD, but no one was ever charged.",
    difficulty: "Extreme",
    year: 1947,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Black_Dahlia" },
      { label: "FBI Vault", url: "https://vault.fbi.gov/Black%20Dahlia" },
    ],
  },

  "ipfs://QmHwaSeongSerial1986": {
    title: "Hwaseong Serial Murders (1986-1991)",
    closed: true,
    closedReason: "Solved in 2019 — Lee Choon-jae identified via DNA evidence and confessed to all murders. Statute of limitations had expired for most cases.",
    description:
      "Between 1986 and 1991, at least 10 women were murdered in Hwaseong, South Korea. The case was Korea's largest unsolved serial murder investigation for 33 years until DNA technology identified Lee Choon-jae in 2019. This mission is marked CLOSED as the case has been solved.",
    difficulty: "Solved",
    year: 1986,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Hwaseong_serial_murders" },
      { label: "Wikipedia (Lee Choon-jae)", url: "https://en.wikipedia.org/wiki/Lee_Choon-jae" },
    ],
  },

  "ipfs://QmJonBenetRamsey1996": {
    title: "JonBenet Ramsey Murder (1996)",
    description:
      "Six-year-old beauty pageant contestant JonBenet Ramsey was found dead in the basement of her family's home in Boulder, Colorado on December 26, 1996. She had been struck on the head and strangled. A ransom note demanding $118,000 was found, but the case became mired in controversy over the investigation's handling. DNA evidence in 2024 excluded all family members as suspects, deepening the mystery of the intruder theory.",
    difficulty: "High",
    year: 1996,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Murder_of_JonBen%C3%A9t_Ramsey" },
      { label: "Boulder PD Cold Case", url: "https://bouldercolorado.gov/services/jonbenet-ramsey-case" },
    ],
  },

  "ipfs://QmJillDando1999": {
    title: "Jill Dando Murder (1999)",
    description:
      "BBC television presenter Jill Dando was shot once in the head on the doorstep of her Fulham home on April 26, 1999. The killing, carried out with a single modified 9mm bullet, triggered Operation Oxborough — one of the largest murder investigations in British history. Barry George was convicted in 2001 but acquitted on appeal in 2008. The case remains officially unsolved with theories ranging from professional hitmen to Serbian retaliation for NATO bombings.",
    difficulty: "High",
    year: 1999,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Murder_of_Jill_Dando" },
      { label: "BBC", url: "https://www.bbc.co.uk/news/uk-48459291" },
    ],
  },

  "ipfs://QmLeeHyungHo1991": {
    title: "Lee Hyung-ho Kidnapping Murder (1991)",
    description:
      "On January 29, 1991, 9-year-old Lee Hyung-ho was kidnapped on his way home from school in Seoul, South Korea. A ransom demand of 200 million won was made, and despite police surveillance of the payoff, the kidnapper escaped with the money. The child's remains were found 2 months later. Despite 44 recorded ransom calls traced to public phones across Seoul, the perpetrator was never identified. The statute of limitations expired in 2006, making it one of Korea's most notorious unsolved cases.",
    difficulty: "High",
    year: 1991,
    references: [
      { label: "Wikipedia (KR)", url: "https://ko.wikipedia.org/wiki/%EC%9D%B4%ED%98%95%ED%98%B8_%EC%9C%A0%EA%B4%B4_%EC%82%B4%EC%9D%B8_%EC%82%AC%EA%B1%B4" },
      { label: "Namu Wiki", url: "https://namu.wiki/w/%EC%9D%B4%ED%98%95%ED%98%B8%20%EC%9C%A0%EA%B4%B4%20%EC%82%B4%EC%9D%B8%20%EC%82%AC%EA%B1%B4" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  MATH
  // ═══════════════════════════════════════════════════════════════

  "ipfs://QmErdosDiscrepancy": {
    title: "Erdos Discrepancy Conjecture — Extensions",
    description:
      "The Erdos Discrepancy Conjecture, proved by Terence Tao in 2015, states that for any infinite sequence of +1 and -1, the partial sums along any arithmetic progression are unbounded. This mission focuses on open extensions and generalizations — tighter bounds, higher-dimensional analogues, and computational complexity of finding low-discrepancy sequences.",
    difficulty: "High",
    year: 1932,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Erd%C5%91s_discrepancy_problem" },
      { label: "Tao's proof (2015)", url: "https://arxiv.org/abs/1509.05363" },
    ],
  },

  "ipfs://QmErdosSumsetConjecture": {
    title: "Erdos Conjecture on Arithmetic Progressions",
    description:
      "This conjecture states that if the sum of reciprocals of a set of positive integers diverges, then the set contains arbitrarily long arithmetic progressions. It implies the Green-Tao theorem (primes contain arbitrarily long APs) as a special case. Despite decades of partial results, the full conjecture remains open and is considered one of the hardest problems in additive combinatorics.",
    difficulty: "Extreme",
    year: 1976,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Erd%C5%91s_conjecture_on_arithmetic_progressions" },
      { label: "Green-Tao theorem", url: "https://en.wikipedia.org/wiki/Green%E2%80%93Tao_theorem" },
    ],
  },

  "ipfs://QmErdosMullin": {
    title: "Erdos-Mullin Sequence — Computability Bounds",
    description:
      "The Erdos-Mullin sequence starts with 2, and each subsequent term is the smallest prime factor of 1 plus the product of all previous terms. Computing each new term requires factoring increasingly large numbers. Only 51 terms are known. Open questions include whether every prime eventually appears and whether there exist efficient algorithms for extending the sequence.",
    difficulty: "Medium",
    year: 1963,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Erd%C5%91s%E2%80%93Mullin_sequence" },
      { label: "OEIS A000945", url: "https://oeis.org/A000945" },
    ],
  },

  "ipfs://QmRiemannHypothesis": {
    title: "Riemann Hypothesis — Millennium Prize",
    description:
      "Proposed by Bernhard Riemann in 1859, this conjecture states that all non-trivial zeros of the Riemann zeta function have real part equal to 1/2. It is intimately connected to the distribution of prime numbers and has profound implications across mathematics. One of the seven Clay Millennium Prize Problems with a $1,000,000 bounty. Over 10 trillion zeros have been verified computationally, all on the critical line.",
    difficulty: "Extreme",
    year: 1859,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Riemann_hypothesis" },
      { label: "Clay Institute", url: "https://www.claymath.org/millennium/riemann-hypothesis/" },
    ],
  },

  "ipfs://QmPvsNP": {
    title: "P vs NP Problem — Millennium Prize",
    description:
      "The central question of theoretical computer science: can every problem whose solution can be quickly verified (NP) also be quickly solved (P)? If P = NP, most modern cryptography would be broken. A Clay Millennium Prize Problem with a $1,000,000 bounty. Expert surveys consistently show ~99% believe P ≠ NP, but no proof exists in either direction despite decades of effort.",
    difficulty: "Extreme",
    year: 1971,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/P_versus_NP_problem" },
      { label: "Clay Institute", url: "https://www.claymath.org/millennium/p-vs-np/" },
    ],
  },

  "ipfs://QmGoldbachConjecture": {
    title: "Goldbach's Conjecture",
    description:
      "Stated by Christian Goldbach in a 1742 letter to Euler: every even integer greater than 2 can be expressed as the sum of two prime numbers. Verified computationally up to 4 x 10^18 (4 quintillion) but never proven. The 'weak' version (every odd integer > 5 is the sum of three primes) was proved by Harald Helfgott in 2013, but the strong conjecture remains one of the oldest open problems in number theory.",
    difficulty: "Extreme",
    year: 1742,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Goldbach%27s_conjecture" },
      { label: "Helfgott weak proof", url: "https://arxiv.org/abs/1312.7748" },
    ],
  },

  "ipfs://QmCollatzConjecture": {
    title: "Collatz Conjecture (3n+1 Problem)",
    description:
      "Take any positive integer n. If even, divide by 2. If odd, multiply by 3 and add 1. Repeat. The conjecture states that this sequence always reaches 1, regardless of the starting number. Despite its elementary statement, it has resisted all proof attempts since 1937. Terence Tao proved in 2019 that 'almost all' starting values eventually reach small numbers, but the full conjecture remains open. Verified for all numbers up to 2^68.",
    difficulty: "High",
    year: 1937,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Collatz_conjecture" },
      { label: "Tao's result (2019)", url: "https://arxiv.org/abs/1909.03562" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  RESEARCH
  // ═══════════════════════════════════════════════════════════════

  "ipfs://QmDarkMatterIdentification": {
    title: "Dark Matter Particle Identification",
    description:
      "Dark matter constitutes approximately 85% of all matter in the universe, yet its particle nature remains unknown. Multiple detection strategies are underway: direct detection (LZ, XENONnT, PandaX), collider searches (LHC), and indirect detection (Fermi-LAT, CTA). Leading candidates include WIMPs, axions, and sterile neutrinos. Despite decades of searching, no dark matter particle has been conclusively detected.",
    difficulty: "Extreme",
    year: 1933,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Dark_matter" },
      { label: "CERN", url: "https://home.cern/science/physics/dark-matter" },
    ],
  },

  "ipfs://QmAbiogenesis": {
    title: "Origin of Life — Abiogenesis Mechanism",
    description:
      "How did non-living chemistry give rise to the first self-replicating life on Earth approximately 3.8 billion years ago? Competing hypotheses include the RNA World, hydrothermal vent chemistry, clay mineral catalysis, and panspermia. Recent experiments have demonstrated spontaneous formation of amino acids, nucleotides, and protocells, but the complete pathway from inorganic chemistry to a self-replicating cell remains unknown.",
    difficulty: "Extreme",
    year: 0,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Abiogenesis" },
      { label: "Nature Reviews", url: "https://www.nature.com/articles/s41570-020-0186-0" },
    ],
  },

  "ipfs://QmQuantumGravity": {
    title: "Quantum Gravity Unification Theory",
    description:
      "General relativity describes gravity at cosmic scales. Quantum mechanics governs the subatomic world. But these two pillars of physics are mathematically incompatible. Unifying them into a theory of quantum gravity is considered the 'holy grail' of theoretical physics. Competing approaches include string theory, loop quantum gravity, causal dynamical triangulations, and asymptotic safety. No experimentally verified theory exists.",
    difficulty: "Extreme",
    year: 1930,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Quantum_gravity" },
      { label: "Stanford Encyclopedia", url: "https://plato.stanford.edu/entries/quantum-gravity/" },
    ],
  },

  "ipfs://QmConsciousnessHardProblem": {
    title: "Hard Problem of Consciousness",
    description:
      "Why does physical brain activity produce subjective conscious experience? Philosopher David Chalmers formulated this as the 'hard problem' in 1995: while neuroscience can explain cognitive functions (the 'easy problems'), it cannot explain why there is 'something it is like' to have an experience. Competing theories include Integrated Information Theory (IIT), Global Workspace Theory, and panpsychism, but none have achieved scientific consensus.",
    difficulty: "Extreme",
    year: 1995,
    references: [
      { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Hard_problem_of_consciousness" },
      { label: "Stanford Encyclopedia", url: "https://plato.stanford.edu/entries/consciousness/" },
    ],
  },
}

// Mission #9 is marked closed in frontend (contract has no closeMission function)
export const CLOSED_MISSIONS = new Set(["ipfs://QmHwaSeongSerial1986"])

export default MISSION_METADATA
