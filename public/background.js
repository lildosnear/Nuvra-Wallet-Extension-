// Nuvra Wallet — background service worker (MV3 stub).
// This phase has no background work: no dapp provider injection,
// no message relay, no key handling. The worker exists so the
// manifest wiring is in place for the phase that adds a provider.
chrome.runtime.onInstalled.addListener(() => {
  // Intentionally empty — install-time setup arrives with the
  // dapp provider phase.
})
