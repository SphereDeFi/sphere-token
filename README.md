# Sphere Finance

## Addresses

- new Sphere token address (is the TUP) : 0x62f594339830b90ae4c084ae7d223ffafd9658a7
- sphere v3 impl: 0x82cf03485bd0cfee315be1e7a9c49f28106f271b
- sphere proxy admin : 0xf27522d4a48b9a5fe53f69e343b15926b540f0ab
- sphere settings (is the TUP) : 0xc49be67aaa0a2476e5132ad77216521971643857
- sphere settings impl: 0x92883e8aef7db8228a55428132b867f8686cd883
- timelock controller : 0xa0dccb94bc35576ab9820c2dda9d6fc0042d6d72

## How to deploy sphere ecosystem

1. deploy Sphere Token
  `npx hardhat run scripts/deploy_spheretoken.js --network mainnet`
3. deploy Sphere Settings
  `npx hardhat run scripts/deploy_spheresettings.js --network mainnet`
3. set Sphere token in the Sphere Settings contract to the TUP address
4. deploy Sphere timelock controller
  `npx hardhat run scripts/deploy_spheretimelockcontroller.js --network mainnet`
5. transfer Proxy Admin ownership to the Sphere timelock controller
6. (optional) transfer TransparentUpgradeableProxy ownership to gnosis
7. deploy Sphere Treasury Swapper
8. deploy Sphere Toolbox
  `npx hardhat run scripts/deploy_spheretoolbox.js --network mainnet`
9. configure the toolbox with router & tokens address

## How to deploy a sphere token contract upgrade

TODO
