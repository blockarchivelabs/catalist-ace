
<div style="display: flex;" align="center">
  <img alt="GitHub license" src="https://img.shields.io/github/license/lidofinance/lido-dao?color=orange">
  <img alt="NodeJS" src="https://img.shields.io/badge/Node_JS-18-blue">
  <img alt="Solidity" src="https://img.shields.io/badge/solidity-multiver-blue">
  <img alt="Hardhat" src="https://img.shields.io/badge/hardhat-^2.12-blue">
  <img alt="Aragon OS" src="https://img.shields.io/badge/Aragon_OS-4.4.0-blue">
  <img alt="GitHub tests" src="https://img.shields.io/github/actions/workflow/status/lidofinance/lido-dao/linters.yml?label=tests">
  <img alt="GitHub code analysis" src="https://img.shields.io/github/actions/workflow/status/lidofinance/lido-dao/analyse.yml?label=code analysis">
  <img alt="GitHub Bytecode" src="https://img.shields.io/github/actions/workflow/status/lidofinance/lido-dao/assert-bytecode.yml?label=assert bytecode">
</div>
<br/>

The **Catalist on Ace Liquid Staking Protocol** allows their users to earn staking rewards on the Beacon chain without locking ace or maintaining staking infrastructure.

Users can deposit ace to the Catalist smart contract and receive bACE tokens in return. The smart contract then stakes tokens with node operators.

Unlike staked ace, the bACE token is free from the limitations associated with a lack of liquidity, and can be transferred at any time. The bACE token balance corresponds to the amount of ace that the holder could request to withdraw.

**NB:** It's advised to read [Documentation](https://docs.catalist.app/) before getting started with this repo.

## Contracts

For the contracts description see <https://docs.catalist.app/> contracts section.

## Deployments

For the protocol contracts addresses see <https://docs.catalist.app/contracts/>

## Development

### Requirements

* shell - bash or zsh
* find
* sed
* jq
* curl
* cut
* node.js v18
* (optional) Lerna
* (optional) Foundry

### Installing Aragon & other deps

Installation is local and doesn't require root privileges.

If you have `yarn` installed globally:

```bash
yarn
```

otherwise:

```bash
npx yarn
```

### Build & test

Run unit tests:

```bash
yarn test
```

Run unit tests and report gas used by each Solidity function:

```bash
yarn test:gas
```

Generate unit test coverage report:

```bash
yarn test:coverage
```

Test coverage is reported to `coverage.json` and `coverage/index.html` files located
inside each app's folder.

> Keep in mind that the code uses `assert`s to check invariants that should always be kept
unless the code is buggy (in contrast to `require` statements which check pre-conditions),
so full branch coverage will never be reported until
[solidity-coverage#219] is implemented.

Run fuzzing tests with foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge test
```

## Deploying

To deploy the smart contracts and run the protocol instance either locally or on a new testnet,
please proceed to the following [scratch deploy documentation](/docs/scratch-deploy.md)

# License

2023 Catalist <info@lido.fi>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the [GNU General Public License](LICENSE)
along with this program. If not, see <https://www.gnu.org/licenses/>.
