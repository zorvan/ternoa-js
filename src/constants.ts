export enum txPallets {
  marketplace = "marketplace",
  nfts = "nfts",
  utility = "utility",
  balances = "balances",
  capsules = "capsules",
  associatedAccounts = "associatedAccounts",
  system = "system",
}

export enum txActions {
  buy = "buy",
  list = "list",
  unlist = "unlist",
  burn = "burn",
  create = "create",
  transfer = "transfer",
  finishSeries = "finishSeries",
  batch = "batch",
  transferKeepAlive = "transferKeepAlive",
  createFromNft = "createFromNft",
  remove = "remove",
  setIpfsReference = "setIpfsReference",
  setAltvrUsername = "setAltvrUsername",
  setCommissionFee = "setCommissionFee",
  setOwner = "setOwner",
  setKind = "setMarketType",
  setName = "setName",
  setUri = "setUri",
  setLogoUri = "setLogoUri",
}

export enum chainQuery {
  nftMintFee = "nftMintFee",
  capsuleMintFee = "capsuleMintFee",
  marketplaceMintFee = "marketplaceMintFee",
  account = "account",
}
