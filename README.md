# Cafe-Chi

![Node.js CI](https://github.com/haydenshively/Cafe-Chi/workflows/Node.js%20CI/badge.svg)

Cafe-Chi is a fully operational arbitrage bot for the [CHI-ETH pair](https://info.uniswap.org/pair/0xa6f3ef841d371a82ca757fad08efc0dee2f1f5e2)
on Uniswap. Most arbitrage relies on complex routing algorithms to find the most
profitable path through a series of exchanges. In contrast, Cafe-Chi takes advantage
of the fact that ETH can be used to mint CHI -- the two assets are uniquely coupled.

The price of CHI on Uniswap can be used to compute a sort of market-rate gas price
for transactions. Cafe-Chi sends transactions with gas prices slightly lower than
that market rate. If they get confirmed, CHI can be minted for less ETH than it
would take to buy it. The difference is taken as profit. Since profits are always
in ETH and always get send back to `tx.origin`, Cafe-Chi is self-sustaining.

## Project Layout

All Solidity code is under the `contracts` directory. In theory one could mint CHI,
then trade it on Uniswap, but here we use a flash swap for fun. Before going through
with the mint, the code checks that the transaction will be profitable according
to `tx.gasprice` (technically some gas is spent before this check, but it's
negligble compared to what _would_ get spent during minting). If you're confused
about the math here, check out the excellent graphic at the top of [this page](https://uniswap.org/docs/v2/core-concepts/swaps/).

Solidity code has already been deployed. Addresses can be found in the corresponding
[Javascript wrapper](./src/network/webthree/haydenshively/cafechi.js). I haven't
verified the code on Etherscan, but feel free to check it yourself or deploy your own
contracts.

Javascript source code and tests are located in the `src` and `tests` directories
respectively.

## Getting started

Install dependencies:

```
yarn install
```

After installation, you'll probably want to run some tests just to make sure your
environment is set up correctly. Make sure your `.env` contains a `PROVIDER_INFURA_ID`
and a `PROVIDER_ALCHEMY_KEY`. If you'd rather use your local node via IPC or some other
combination of providers, just multiple the array that's used to instantiate
`MultiSendProvider` in [tests/setup.js](./tests/setup.js). Then run:

```
yarn test
```

To actually run Cafe-Chi, you'll want to customize [config.json](./config.json). Each
entry in the `txManagers` object should have its own `envKeyAddress` and `envKeySecret`.
These should reference the name of the `.env` variable that contains your address and
secret. For example, if your address is stored in the MY_ADDRESS variable, you should
set `envKeyAddress: "MY_ADDRESS"`. Note that the "secret" is your private key *without*
the '0x' at the beginning, while your address should include the '0x'.

Other parameters:

- `interval`: How often (in seconds) to check market conditions and send new
transactions
- `numPending`: How many transactions to keep pending at any given time. Don't set this
too high, as you will eventually exhaust the arbitrage opportunity and all remaining
transactions will fail.
- `ratio`: The percent of market-rate gas price that your transactions will be sent at.
For example, if the CHI-ETH pair thinks its CHI was minted at 30 gwei, and you set this
to .99, your transactions will be sent at 29.7 gwei. Higher ratios are more likely to
get confirmed, but lower ones result in more profit.
- `providers`: Specifies what services will be used to send transactions. Infura will
work just fine. See [tests/setup.js](./tests/setup.js) for how to specify an Infura or
Alchemy provider.

Also note that each txManager will run in its own Node.js process.

Finally, it can be useful to get notifications when transactions are sent. If you want
Slack messages, add a SLACK_WEBHOOK environment variable. Otherwise you can remove
Slack from the winston transports array in [src/setup.js](./src/setup.js).

Ready to start? Run:

```
yarn cafe-chi
```

I recommend running this inside of a tmux session (`tmux new -s cafechi`) so that it
will run even if your SSH connection / terminal window gets closed.

## What next?

Experiment with the various parameters to see how consistently you can get transactions
to go through, or modify the Solidity code to mint different amounts of CHI at once
(I have one that mints 140 and another that mints only 10). As long as your account
starts out with ~0.2 ETH, you should be able to sit back and watch your balance grow
(albeit rather slowly). Good luck!

> P.S. If you're a developer, feel free to write some tests for CafeChi.sol and/or
submit a PR to use truffle rather than OpenZeppelin CLI.

## Disclaimer

_USE THIS CODE AT YOUR OWN RISK!_ There's no warranty of any kind, and I can't promise
that you'll make money. Do your own research.
