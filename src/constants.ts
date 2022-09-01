export enum txPallets {
  assets = "assets",
  marketplace = "marketplace",
  nft = "nft",
  rent = "rent",
  utility = "utility",
  balances = "balances",
  associatedAccounts = "associatedAccounts",
  system = "system",
}

export enum txActions {
  create = "create",
  transfer = "transfer",
  transferAll = "transferAll",
  transferKeepAlive = "transferKeepAlive",
  batch = "batch",
  batchAll = "batchAll",
  forceBatch = "forceBatch",

  // nft
  createNft = "createNft",
  burnNft = "burnNft",
  transferNft = "transferNft",
  delegateNft = "delegateNft",
  setRoyalty = "setRoyalty",
  addNftToCollection = "addNftToCollection",
  createCollection = "createCollection",
  limitCollection = "limitCollection",
  closeCollection = "closeCollection",
  burnCollection = "burnCollection",
  setNftMintFee = "setNftMintFee",

  // marketplace
  buyNft = "buyNft",
  createMarketplace = "createMarketplace",
  listNft = "listNft",
  unlistNft = "unlistNft",
  setMarketplaceConfiguration = "setMarketplaceConfiguration",
  setMarketplaceKind = "setMarketplaceKind",
  setMarketplaceOwner = "setMarketplaceOwner",
  setMarketplaceMintFee = "setMarketplaceMintFee",
}

export enum txEvent {
  ExtrinsicSuccess = "ExtrinsicSuccess",
  ExtrinsicFailed = "ExtrinsicFailed",
  BatchCompleted = "BatchCompleted",
  BatchInterrupted = "BatchInterrupted",
  nftsCreated = "Created",
  nftsBurned = "Burned",
  nftsTransfered = "Transfered",
  MarketplaceCreated = "MarketplaceCreated",
}

export enum chainQuery {
  nftMintFee = "nftMintFee",
  nfts = "nfts",
  nextNFTId = "nextNFTId",
  nextCollectionId = "nextCollectionId",
  marketplaceMintFee = "marketplaceMintFee",
  account = "account",
  number = "number",
  collections = "collections",
  nextMarketplaceId = "nextMarketplaceId",
  marketplaces = "marketplaces",
  listedNfts = "listedNfts",
  contracts = "contracts",
  numberOfCurrentContracts = "numberOfCurrentContracts",
  availableQueue = "availableQueue",
  fixedQueue = "fixedQueue",
  subscriptionQueue = "subscriptionQueue",
  offers = "offers",
}

export enum chainConstants {
  initialMintFee = "initialMintFee",
  collectionSizeLimit = "collectionSizeLimit",
  existentialDeposit = "existentialDeposit",
  nftOffchainDataLimit = "nftOffchainDataLimit",
  collectionOffchainDataLimit = "collectionOffchainDataLimit",
  offchainDataLimit = "offchainDataLimit",
  accountSizeLimit = "accountSizeLimit",
  actionsInBlockLimit = "actionsInBlockLimit",
  contractExpirationDuration = "contractExpirationDuration",
  simultaneousContractLimit = "simultaneousContractLimit",
}

export enum WaitUntil {
  BlockInclusion,
  BlockFinalization,
}

export enum Errors {
  EXTRINSIC_FAILED = "EXTRINSIC_FAILED",
  EVENT_NOT_FOUND = "EVENT_NOT_FOUND",
  SEED_NOT_FOUND = "SEED_NOT_FOUND",
  PUBLIC_SEED_ADDRESS_NOT_FOUND = "PUBLIC_SEED_ADDRESS_NOT_FOUND",
  VALUE_MUST_BE_GREATER_THAN_0 = "VALUE_MUST_BE_GREATER_THAN_0",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  API_NOT_INITIALIZED = "API_NOT_INITIALIZED",
  API_NOT_CONNECTED = "API_NOT_CONNECTED",
  TRANSACTION_NOT_IN_BLOCK = "TRANSACTION_NOT_IN_BLOCK",
  EXTRINSIC_NOT_FOUND = "EXTRINSIC_NOT_FOUND",
  OFFCHAIN_LENGTH_TOO_HIGH = "OFFCHAIN_LENGTH_TOO_HIGH",
  LIMIT_TOO_LOW = "LIMIT_TOO_LOW",
  LIMIT_TOO_HIGH = "LIMIT_TOO_HIGH",
  NFT_NOT_FOUND = "NFT_NOT_FOUND",
  COLLECTION_NOT_FOUND = "COLLECTION_NOT_FOUND",
  MUST_BE_PERCENTAGE = "MUST_BE_PERCENTAGE",
  NFT_CONVERSION_ERROR = "NFT_CONVERSION_ERROR",
  COLLECTION_CONVERSION_ERROR = "COLLECTION_CONVERSION_ERROR",
  MARKETPLACE_CONVERSION_ERROR = "MARKETPLACE_CONVERSION_ERROR",
  LISTED_NFT_CONVERSION_ERROR = "LISTED_NFT_CONVERSION_ERROR",
  IPFS_FILE_UNDEFINED_ON_UPLOAD = "IPFS_FILE_UNDEFINED_ON_UPLOAD",
  BLOCK_NOT_FOUND_ON_CHAIN = "BLOCK_NOT_FOUND_ON_CHAIN",
  RENT_NFT_CONVERSION_ERROR = "RENT_NFT_CONVERSION_ERROR",
}
